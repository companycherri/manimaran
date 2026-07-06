import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Blog } from "@/entities/Blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, FileText, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { UploadFile } from "@/integrations/Core";
import { format } from "date-fns";
import ReactQuill from 'react-quill';

export default function AdminBlogs() {
  const [user, setUser] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featured_image: "",
    author: "",
    published: false,
    publish_date: "",
    tags: ""
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await User.me();
      if (currentUser.role !== 'admin') {
        window.location.href = createPageUrl("Home");
        return;
      }
      setUser(currentUser);
      setFormData(prev => ({ ...prev, author: currentUser.full_name }));
      await loadBlogs();
    } catch (error) {
      window.location.href = createPageUrl("Home");
    }
  };

  const loadBlogs = async () => {
    setLoading(true);
    const allBlogs = await Blog.list("-created_date");
    setBlogs(allBlogs);
    setLoading(false);
  };

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData({ ...formData, featured_image: file_url });
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const blogData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
        publish_date: formData.publish_date || new Date().toISOString()
      };
      
      if (editingBlog) {
        await Blog.update(editingBlog.id, blogData);
        toast.success("Blog updated successfully");
      } else {
        await Blog.create(blogData);
        toast.success("Blog created successfully");
      }
      
      setDialogOpen(false);
      resetForm();
      await loadBlogs();
    } catch (error) {
      toast.error("Failed to save blog");
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || "",
      content: blog.content,
      featured_image: blog.featured_image || "",
      author: blog.author || "",
      published: blog.published || false,
      publish_date: blog.publish_date ? blog.publish_date.split('T')[0] : "",
      tags: blog.tags || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (blogId) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    
    try {
      await Blog.delete(blogId);
      toast.success("Blog deleted successfully");
      await loadBlogs();
    } catch (error) {
      toast.error("Failed to delete blog");
    }
  };

  const togglePublish = async (blog) => {
    try {
      await Blog.update(blog.id, { ...blog, published: !blog.published });
      toast.success(blog.published ? "Blog unpublished" : "Blog published");
      await loadBlogs();
    } catch (error) {
      toast.error("Failed to update blog");
    }
  };

  const resetForm = () => {
    setEditingBlog(null);
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      featured_image: "",
      author: user?.full_name || "",
      published: false,
      publish_date: "",
      tags: ""
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#8B6F47]">Loading blogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] to-[#FFE8C5] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[#5C4033]">Blog Management</h1>
            <p className="text-[#8B6F47]">{blogs.length} blog posts</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
                <Plus className="w-4 h-4 mr-2" />
                New Blog Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#5C4033]">
                  {editingBlog ? "Edit Blog Post" : "Create New Blog Post"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      title: e.target.value,
                      slug: generateSlug(e.target.value)
                    })}
                    required
                  />
                </div>

                <div>
                  <Label>Slug *</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Excerpt</Label>
                  <Textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Content *</Label>
                  <ReactQuill
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label>Featured Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {formData.featured_image && (
                    <img src={formData.featured_image} alt="Preview" className="mt-2 w-full h-48 object-cover rounded-lg" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Author</Label>
                    <Input
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Publish Date</Label>
                    <Input
                      type="date"
                      value={formData.publish_date}
                      onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="recipe, festival, tradition"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span>Publish immediately</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-[#FFD700] text-[#5C4033] hover:bg-[#FFA500]">
                    {editingBlog ? "Update Post" : "Create Post"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Blogs List */}
        <div className="space-y-4">
          {blogs.map((blog, index) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {blog.featured_image && (
                      <div className="w-48 h-32 bg-[#FFF8E7] rounded-lg overflow-hidden flex-shrink-0">
                        <img src={blog.featured_image} alt={blog.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-[#5C4033] mb-1">{blog.title}</h3>
                          {blog.excerpt && (
                            <p className="text-sm text-[#8B6F47] mb-2">{blog.excerpt}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-[#8B6F47]">
                            {blog.author && <span>By {blog.author}</span>}
                            {blog.publish_date && (
                              <span>{format(new Date(blog.publish_date), 'PPP')}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {blog.published ? (
                            <Badge className="bg-green-100 text-green-800">Published</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePublish(blog)}
                        >
                          {blog.published ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                          {blog.published ? "Unpublish" : "Publish"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(blog)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(blog.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {blogs.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-[#8B6F47] mx-auto mb-4" />
            <p className="text-[#8B6F47] text-lg">No blog posts yet</p>
            <p className="text-sm text-[#8B6F47] mb-4">Start sharing your stories and recipes</p>
          </div>
        )}
      </div>
    </div>
  );
}