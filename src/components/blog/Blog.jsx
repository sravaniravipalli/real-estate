import { useEffect, useState } from "react";
import BlogCard from "./BlogCard";
import useTitle from "hook/useTitle";
import { Link } from "react-router-dom";
import { apiFetch } from "lib/apiClient";

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    setLoadError("");
    apiFetch("/blogs")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load blogs from backend");
        return res.json();
      })
      .then((data) => setBlogs(data.data || data.blogs || []))
      .catch((err) => setLoadError(err.message || "Failed to load blogs."));
  }, []);

  useTitle('Blog');
  return (
    <section className="bg-gray-100">
      <div className="container px-10 pt-20 md:pt-28 lg:pt-28 pb-20">
      <div className="mx-auto max-w-2xl lg:mx-0">
      <h2 className="text-2xl lg:text-4xl font-bold tracking-tight text-gray-900 ">Our Blogs</h2>
      <div className="divider my-1 bg-primary h-[5px] w-[5%] "></div>
      <p className=" text-gray-600">Learn about the benefits, possibilities, and potential of using advanced language models to create compelling property listings. Stay ahead of the curve and unlock the future of property generation with OpenAI</p>
    </div>
    <div className="divider mt-0"></div>
        {loadError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-semibold">{loadError}</p>
            <p className="text-red-600 text-sm mt-1">Seed blogs into the database, then refresh.</p>
          </div>
        )}
        <div>
          {blogs.map((blog) => {
            return <Link to={`/blog/${blog._id}`} key={blog._id}>
            <BlogCard blog={blog} />
            </Link>
          })}
        </div>
      </div>
    </section>
  );
};

export default Blog;
