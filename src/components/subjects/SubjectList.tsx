/**
 * Subject Cards Grid List
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Atom,
  FlaskConical,
  Sigma,
  Shapes,
  BookOpen,
  Languages,
  Folder,
  ArrowLeft,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/persianDate';

const ICON_MAP: Record<string, React.ReactNode> = {
  Atom: <Atom className="w-6 h-6" />,
  FlaskConical: <FlaskConical className="w-6 h-6" />,
  Sigma: <Sigma className="w-6 h-6" />,
  Shapes: <Shapes className="w-6 h-6" />,
  BookOpen: <BookOpen className="w-6 h-6" />,
  Languages: <Languages className="w-6 h-6" />,
};

export const SubjectList: React.FC = () => {
  const { subjects, navigate } = useApp();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {subjects.map((sub) => {
        const icon = ICON_MAP[sub.icon] || <Folder className="w-6 h-6" />;

        return (
          <div
            key={sub.id}
            onClick={() => navigate({ type: 'subject', slug: sub.slug })}
            className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-cyan-500/50 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5 flex flex-col justify-between cursor-pointer overflow-hidden"
          >
            {/* Subject Accent Top Border */}
            <div
              className="absolute top-0 right-0 left-0 h-1 transition-all group-hover:h-1.5"
              style={{ backgroundColor: sub.color }}
            />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: `${sub.color}15`,
                    color: sub.color,
                  }}
                >
                  {icon}
                </div>

                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {toPersianDigits(sub.notes_count || 0)} جزوه
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors mb-2">
                {sub.name}
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-6">
                {sub.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-indigo-600 dark:text-cyan-400">
              <span>مشاهده و دانلود جزوه‌ها</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
