import { Link } from '@tanstack/react-router';
import { Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Novel } from '../types/novel';

interface NovelCardProps {
  novel: Novel;
  onEdit: () => void;
  onDelete: () => void;
}

export function NovelCard({ novel, onEdit, onDelete }: NovelCardProps) {
  return (
    <div className="relative rounded-lg border shadow-sm hover:shadow-md transition-shadow bg-card">
      <Link to="/novels/$novelId" params={{ novelId: novel.id }} className="block">
        {novel.cover_image_url ? (
          <img
            src={novel.cover_image_url}
            alt={novel.title}
            className="w-full h-40 object-cover rounded-t-lg"
          />
        ) : (
          <div className="w-full h-40 bg-muted rounded-t-lg flex items-center justify-center">
            <span className="text-muted-foreground text-sm">커버 이미지 없음</span>
          </div>
        )}
        <div className="p-4">
          <h3 className="font-semibold text-foreground truncate">{novel.title}</h3>
          <p className="text-sm text-muted-foreground">{novel.genre ?? '장르 없음'}</p>
          <p className="text-xs text-muted-foreground mt-1">{novel.chapter_count}챕터</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(novel.updated_at), 'yyyy.MM.dd', { locale: ko })}
          </p>
        </div>
      </Link>
      <div className="absolute top-2 right-2 flex gap-1">
        <button
          onClick={(e) => {
            e.preventDefault();
            onEdit();
          }}
          className="p-1.5 rounded bg-background/80 hover:bg-background transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
          className="p-1.5 rounded bg-background/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
