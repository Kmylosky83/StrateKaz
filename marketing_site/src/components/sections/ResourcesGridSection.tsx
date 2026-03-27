import React from 'react';
import { FolderOpen } from 'lucide-react';
import { cn } from '@utils/cn';
import { ResourceCard } from '@components/resources/ResourceCard';
import type { Resource, ResourceCategoryCode } from '@/data/resources';
import { resourceCategories } from '@/data/resources';

interface ResourcesGridSectionProps {
  resources: Resource[];
  activeCategory: ResourceCategoryCode | 'all';
  onCategoryChange: (category: ResourceCategoryCode | 'all') => void;
  onDownload: (resource: Resource) => void;
  searchQuery: string;
}

export const ResourcesGridSection: React.FC<ResourcesGridSectionProps> = ({
  resources,
  activeCategory,
  onCategoryChange,
  onDownload,
  searchQuery,
}) => {
  return (
    <section className='pb-section-md'>
      <div className='container-responsive'>
        {/* Category Filters */}
        <div className='mb-8'>
          <div className='flex flex-wrap gap-2 justify-center'>
            {/* All tab */}
            <button
              onClick={() => onCategoryChange('all')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[40px]',
                activeCategory === 'all'
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-black-card border border-black-border text-white-muted hover:text-white-text hover:border-brand-500/30'
              )}
            >
              Todos
            </button>

            {/* Category tabs */}
            {resourceCategories.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.code;

              return (
                <button
                  key={cat.code}
                  onClick={() => onCategoryChange(cat.code)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-h-[40px]',
                    isActive
                      ? 'text-white shadow-lg'
                      : 'bg-black-card border border-black-border text-white-muted hover:text-white-text hover:border-black-border-soft'
                  )}
                  style={isActive ? { backgroundColor: cat.color, boxShadow: `0 4px 14px ${cat.color}33` } : undefined}
                >
                  <Icon className='h-3.5 w-3.5' />
                  <span className='hidden sm:inline'>{cat.name}</span>
                  <span className='sm:hidden'>{cat.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results count */}
        <div className='flex items-center justify-between mb-6'>
          <p className='text-sm text-white-muted'>
            {resources.length} recurso{resources.length !== 1 ? 's' : ''}
            {searchQuery && (
              <span>
                {' '}para "<span className='text-white-text'>{searchQuery}</span>"
              </span>
            )}
            {activeCategory !== 'all' && (
              <span>
                {' '}en{' '}
                <span className='text-white-text'>
                  {resourceCategories.find(c => c.code === activeCategory)?.name}
                </span>
              </span>
            )}
          </p>
        </div>

        {/* Grid */}
        {resources.length > 0 ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5'>
            {resources.map(resource => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onDownload={onDownload}
              />
            ))}
          </div>
        ) : (
          <div className='text-center py-16'>
            <FolderOpen className='h-12 w-12 text-white-muted/30 mx-auto mb-4' />
            <p className='font-title font-semibold text-white-text mb-2'>
              No se encontraron recursos
            </p>
            <p className='text-sm text-white-muted'>
              Intenta con otros terminos de busqueda o selecciona otra categoria.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ResourcesGridSection;
