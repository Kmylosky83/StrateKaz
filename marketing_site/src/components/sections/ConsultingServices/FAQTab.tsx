import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Card } from '@components/ui/card';
import { faqs } from './data';

interface FAQTabProps {
  selectedCategory: string;
  expandedFAQ: string | null;
  onCategoryChange: (category: string) => void;
  onToggleFAQ: (question: string) => void;
}

export const FAQTab: React.FC<FAQTabProps> = ({
  selectedCategory,
  expandedFAQ,
  onCategoryChange,
  onToggleFAQ,
}) => {
  return (
    <div className='space-y-8'>
      <div className='max-w-content-narrow sm:max-w-content-normal lg:max-w-content-wide xl:max-w-layout-xl 2xl:max-w-layout-2xl mx-auto'>
        {/* Category Tabs */}
        <div className='flex flex-wrap justify-center gap-2 mb-6 sm:mb-8 px-2 sm:px-0'>
          {faqs.map(category => (
            <button
              key={category.category}
              onClick={() => onCategoryChange(category.category)}
              className={`px-3 sm:px-4 py-3 sm:py-2 rounded-lg font-medium transition-all duration-300 min-h-[44px] text-xs sm:text-sm ${selectedCategory === category.category
                ? category.category === 'Servicios de Consultoría'
                  ? 'bg-blue-500 text-white'
                  : category.category === 'Inversión y ROI'
                    ? 'bg-green-500 text-white'
                    : 'bg-brand-500 text-white'
                : 'bg-black-card-soft text-white-muted hover:text-white hover:bg-black-hover'
                }`}
            >
              <span className='hidden sm:inline'>{category.category}</span>
              <span className='sm:hidden'>
                {category.category === 'Servicios de Consultoría'
                  ? 'Servicios'
                  : category.category === 'Plataforma de Gestión Integral'
                    ? 'Plataforma'
                    : category.category === 'Inversión y ROI'
                      ? 'ROI'
                      : category.category}
              </span>
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className='space-y-4'>
          {faqs
            .find(cat => cat.category === selectedCategory)
            ?.items.map((faq, index) => (
              <Card
                key={index}
                className='bg-black-card-soft border border-black-border-soft overflow-hidden'
              >
                <button
                  onClick={() => onToggleFAQ(faq.question)}
                  className='w-full px-4 sm:px-6 py-4 text-left flex items-start justify-between hover:bg-black-hover transition-colors min-h-[44px]'
                >
                  <span className='font-semibold text-sm sm:text-base text-white-text font-title pr-4 leading-relaxed'>
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-white-muted transition-transform flex-shrink-0 mt-0.5 ${expandedFAQ === faq.question ? 'rotate-180' : ''
                      }`}
                    aria-hidden='true'
                  />
                </button>

                {expandedFAQ === faq.question && (
                  <div className='px-4 sm:px-6 pb-4'>
                    <p className='text-sm sm:text-base text-white-muted-soft leading-relaxed font-content'>
                      {faq.answer}
                    </p>
                  </div>
                )}
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
};
