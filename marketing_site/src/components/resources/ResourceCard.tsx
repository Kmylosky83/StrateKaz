import React from 'react';
import { FileSpreadsheet, FileText, FileType, Presentation, Download, Mail, Sparkles } from 'lucide-react';
import { cn } from '@utils/cn';
import type { Resource, ResourceFormat, ResourceCategory } from '@/data/resources';
import { formatMeta, getCategoryByCode } from '@/data/resources';

// ---------------------------------------------------------------------------
// Format icon mapping
// ---------------------------------------------------------------------------

const formatIcons: Record<ResourceFormat, React.ComponentType<{ className?: string }>> = {
  excel: FileSpreadsheet,
  word: FileText,
  pdf: FileType,
  ppt: Presentation,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ResourceCardProps {
  resource: Resource;
  onDownload: (resource: Resource) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onDownload }) => {
  const category = getCategoryByCode(resource.category) as ResourceCategory;
  const FormatIcon = formatIcons[resource.format];
  const CategoryIcon = category.icon;
  const fmeta = formatMeta[resource.format];

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-black-border bg-black-card',
        'hover:border-black-border-soft hover:bg-black-card-soft',
        'transition-all duration-300 flex flex-col'
      )}
    >
      {/* Badges */}
      <div className='absolute top-3 right-3 flex gap-2'>
        {resource.isNew && (
          <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 text-xs font-medium'>
            <Sparkles className='h-3 w-3' />
            Nuevo
          </span>
        )}
        {resource.requiresEmail && (
          <span className='flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium'>
            <Mail className='h-3 w-3' />
            Premium
          </span>
        )}
      </div>

      {/* Content */}
      <div className='p-5 flex-1 flex flex-col'>
        {/* Category + Format Row */}
        <div className='flex items-center justify-between mb-4'>
          <div className={cn('flex items-center gap-2 text-xs font-medium', category.colorClass)}>
            <div className={cn('p-1.5 rounded-lg', category.bgClass)}>
              <CategoryIcon className='h-3.5 w-3.5' />
            </div>
            <span>{category.name}</span>
          </div>

          <div className={cn('flex items-center gap-1 text-xs', fmeta.colorClass)}>
            <FormatIcon className='h-3.5 w-3.5' />
            <span className='font-medium'>{fmeta.label}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className='font-title font-semibold text-white-text text-sm leading-snug mb-2 group-hover:text-brand-400 transition-colors line-clamp-2'>
          {resource.title}
        </h3>

        {/* Description */}
        <p className='text-xs text-white-muted leading-relaxed mb-4 flex-1 line-clamp-3'>
          {resource.description}
        </p>

        {/* Tags */}
        <div className='flex flex-wrap gap-1.5 mb-4'>
          {resource.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className='px-2 py-0.5 rounded-md bg-black-hover text-white-muted text-[10px] font-medium'
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Download Button */}
        <button
          onClick={() => onDownload(resource)}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium',
            'bg-black-hover border border-black-border text-white-text',
            'hover:bg-brand-500 hover:border-brand-500 hover:text-white',
            'transition-all duration-300 min-h-[44px]'
          )}
        >
          <Download className='h-4 w-4' />
          {resource.requiresEmail ? 'Descargar (requiere email)' : 'Descargar Gratis'}
        </button>
      </div>
    </div>
  );
};

export default ResourceCard;
