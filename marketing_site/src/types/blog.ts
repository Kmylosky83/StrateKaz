export type BlogCategory = 'Seguridad' | 'Calidad' | 'Medio Ambiente' | 'Automatización' | 'Tecnología';

export interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    content: string; // Markdown or HTML
    author: {
        name: string;
        avatar?: string;
        role: string;
    };
    date: string;
    category: BlogCategory;
    imageUrl: string;
    slug: string;
    tags: string[];
    readTime: string;
}
