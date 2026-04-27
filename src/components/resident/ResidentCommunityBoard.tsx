import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthSession } from '@/contexts/auth';
import { toast } from 'sonner';
import {
  createCommunityPost,
  deleteCommunityPost,
  fetchCommunityPosts,
  type ResidentCommunityPost,
} from '@/services/resident/communityPostsApi';
import { Loader2, MessageCircle, Pin, Trash2 } from 'lucide-react';

interface ResidentCommunityBoardProps {
  propertyId: string | null;
}

export function ResidentCommunityBoard({ propertyId }: ResidentCommunityBoardProps) {
  const { user } = useAuthSession();
  const [posts, setPosts] = useState<ResidentCommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    if (!propertyId) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchCommunityPosts(propertyId);
      setPosts(rows);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePost = async () => {
    if (!propertyId || !body.trim()) return;
    setPosting(true);
    try {
      const res = await createCommunityPost(propertyId, body);
      if (res.ok) {
        setBody('');
        toast.success('Posted to your building board');
        await load();
      } else {
        toast.error(res.error || 'Could not post');
      }
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: string, authorId: string) => {
    if (!user || authorId !== user.id) return;
    const res = await deleteCommunityPost(id);
    if (res.ok) {
      toast.success('Post removed');
      await load();
    } else {
      toast.error(res.error || 'Could not delete');
    }
  };

  if (!propertyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Community board</CardTitle>
          <CardDescription>
            When you are linked to a property, you can share updates with neighbors here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Community board
          </CardTitle>
          <CardDescription>
            Building-scoped posts visible to residents and property managers on this property. Be
            respectful and avoid sharing private financial details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Share a note with your building…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[88px]"
          />
          <Button
            type="button"
            onClick={() => void handlePost()}
            disabled={posting || !body.trim()}
          >
            {posting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting…
              </>
            ) : (
              'Post'
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent posts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts yet. Start the conversation.</p>
          ) : (
            <ScrollArea className="max-h-[420px] pr-3">
              <ul className="space-y-3">
                {posts.map((p) => (
                  <li key={p.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {p.pinned ? (
                            <Pin
                              className="h-3.5 w-3.5 text-muted-foreground"
                              aria-label="Pinned"
                            />
                          ) : null}
                          <span className="text-xs text-muted-foreground">
                            {new Date(p.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">{p.body}</p>
                      </div>
                      {user?.id === p.author_id ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-destructive"
                          aria-label="Delete post"
                          onClick={() => void handleDelete(p.id, p.author_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
