import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { BlogPost } from '@/types/blog';
import { cn } from '@/utils/cn';

interface BlogCardProps {
    post: BlogPost;
    className?: string;
}

const categoryColors = {
    'Seguridad': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Calidad': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Medio Ambiente': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Automatización': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'Tecnología': 'bg-violet-500/10 text-violet-400 border-violet-500/20'
};

export const BlogCard: React.FC<BlogCardProps> = ({ post, className }) => {
    return (
        <article
            className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 transition-all hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10 h-full",
                className
            )}
        >
            {/* Image Container */}
            <div className="relative w-full aspect-video overflow-hidden">
                <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-60" />

                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                    <span className={cn(
                        "px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-md",
                        categoryColors[post.category] || 'bg-neutral-800 text-neutral-300'
                    )}>
                        {post.category}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-6">
                {/* Meta */}
                <div className="flex items-center space-x-4 text-xs text-neutral-400 mb-3">
                    <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{new Date(post.date).toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{post.readTime}</span>
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-brand-400 transition-colors font-title">
                    <Link to={`/blog/${post.slug}`} className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden="true" />
                        {post.title}
                    </Link>
                </h3>

                {/* Excerpt */}
                <p className="text-neutral-400 text-sm mb-4 line-clamp-3 flex-1 font-content">
                    {post.excerpt}
                </p>

                {/* Author & Action */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-800">
                    <div className="flex items-center space-x-2">
                        <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-8 h-8 rounded-full border border-neutral-700"
                        />
                        <div>
                            <p className="text-xs font-medium text-white">{post.author.name}</p>
                            <p className="text-xs text-neutral-500">{post.author.role}</p>
                        </div>
                    </div>
                    <span className="flex items-center text-brand-400 text-xs font-medium group-hover:translate-x-1 transition-transform">
                        Leer más <ArrowRight className="w-3 h-3 ml-1" />
                    </span>
                </div>
            </div>
        </article>
    );
};
