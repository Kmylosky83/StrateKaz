import { BlogPost } from '@/types/blog';

export const blogPosts: BlogPost[] = [
    {
        id: '1',
        title: 'Transformación Digital en SST: Más allá del papel',
        excerpt: 'Descubre cómo la digitalización de los procesos de Seguridad y Salud en el Trabajo está reduciendo accidentes y mejorando la eficiencia operativa.',
        content: '...',
        author: {
            name: 'Ing. Carlos Rodriguez',
            role: 'Consultor Senior HSEQ',
            avatar: 'https://ui-avatars.com/api/?name=Carlos+Rodriguez&background=0D8ABC&color=fff'
        },
        date: '2025-12-20',
        category: 'Seguridad',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000',
        slug: 'transformacion-digital-sst',
        tags: ['SST', 'Digitalización', 'Seguridad Industrial'],
        readTime: '5 min'
    },
    {
        id: '2',
        title: 'Automatización de Matrices de Riesgos con IA',
        excerpt: 'Analizamos cómo la Inteligencia Artificial puede ayudar a identificar peligros y valorar riesgos de forma más precisa en la GTC 45.',
        content: '...',
        author: {
            name: 'Ana García',
            role: 'Lead Developer',
            avatar: 'https://ui-avatars.com/api/?name=Ana+Garcia&background=6366f1&color=fff'
        },
        date: '2025-12-18',
        category: 'Tecnología',
        imageUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=1000',
        slug: 'automatizacion-matrices-riesgos-ia',
        tags: ['IA', 'GTC45', 'Riesgos'],
        readTime: '7 min'
    },
    {
        id: '3',
        title: 'Gestión Ambiental: ISO 14001 en la Era 4.0',
        excerpt: 'Integrando sensores IoT para el monitoreo en tiempo real de aspectos e impactos ambientales en la industria.',
        content: '...',
        author: {
            name: 'Maria López',
            role: 'Especialista Ambiental',
            avatar: 'https://ui-avatars.com/api/?name=Maria+Lopez&background=10B981&color=fff'
        },
        date: '2025-12-15',
        category: 'Medio Ambiente',
        imageUrl: 'https://images.unsplash.com/photo-1497436072909-60f360e1d4b0?auto=format&fit=crop&q=80&w=1000',
        slug: 'gestion-ambiental-iso-14001-4-0',
        tags: ['ISO 14001', 'IoT', 'Sostenibilidad'],
        readTime: '4 min'
    },
    {
        id: '4',
        title: 'Arquitectura Hexagonal en Sistemas de Gestión',
        excerpt: 'Un vistazo técnico a cómo construimos StrateKaz utilizando principios de arquitectura limpia para garantizar escalabilidad.',
        content: '...',
        author: {
            name: 'Dev Team',
            role: 'StrateKaz Engineering',
            avatar: 'https://ui-avatars.com/api/?name=StrateKaz+Team&background=111827&color=fff'
        },
        date: '2025-12-10',
        category: 'Tecnología',
        imageUrl: 'https://images.unsplash.com/photo-1550439062-609e1531270e?auto=format&fit=crop&q=80&w=1000',
        slug: 'arquitectura-hexagonal-sistemas-gestion',
        tags: ['Arquitectura', 'Backend', 'Software Design'],
        readTime: '8 min'
    },
    {
        id: '5',
        title: 'Calidad 4.0: El futuro de la ISO 9001',
        excerpt: 'La evolución de los sistemas de gestión de calidad hacia modelos predictivos y automatizados.',
        content: '...',
        author: {
            name: 'Juan Perez',
            role: 'Auditor Líder Calidad',
            avatar: 'https://ui-avatars.com/api/?name=Juan+Perez&background=F59E0B&color=fff'
        },
        date: '2025-12-05',
        category: 'Calidad',
        imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d59bc67f40?auto=format&fit=crop&q=80&w=1000',
        slug: 'calidad-4-0-futuro-iso-9001',
        tags: ['Calidad', 'ISO 9001', 'Innovación'],
        readTime: '6 min'
    }
];
