import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function TaskComments({ comments = [], onAddComment, isLoading }) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = async () => {
    if (newComment.trim()) {
      await onAddComment(newComment);
      setNewComment('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-muted-foreground" />
        <h4 className="font-semibold text-sm">Comentários & Feedback</h4>
      </div>

      {/* List of comments */}
      <div className="max-h-48 overflow-y-auto space-y-2 bg-muted/30 rounded-lg p-3">
        {comments && comments.length > 0 ? (
          comments.map((comment, idx) => (
            <div key={comment.id || idx} className="text-sm border-l-2 border-primary/30 pl-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-xs">{comment.author || 'Anônimo'}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { locale: ptBR, addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-foreground/80">{comment.text}</p>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">Nenhum comentário ainda</p>
        )}
      </div>

      {/* Add comment */}
      <div className="flex gap-2">
        <Input
          placeholder="Adicionar comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          className="text-sm"
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isLoading || !newComment.trim()}
        >
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}