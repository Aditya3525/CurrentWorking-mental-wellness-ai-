import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';


interface PracticeInput {
  title: string;
  types: string[];
  duration: number;
  level: string;
  approach: string;
  description?: string;
  audioUrl?: string;
  videoUrl?: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  tags?: string;
  isPublished: boolean;
}

export interface PracticeRecord {
  id: string;
  title: string;
  types?: string; // CSV from backend
  type?: string; // legacy
  duration: number;
  level?: string;
  difficulty?: string;
  approach: string;
  description?: string;
  audioUrl?: string;
  videoUrl?: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  tags?: string;
  isPublished: boolean;
}
interface Props { existing?: Partial<PracticeRecord>; onSaved: (item: PracticeRecord)=>void; onClose: ()=>void; }

export const PracticeForm: React.FC<Props> = ({ existing, onSaved, onClose }) => {
  const { push } = useToast();
  const [form, setForm] = useState<PracticeInput>(existing ? {
    title: existing.title,
    types: existing.types ? existing.types.split(',') : [existing.type || 'Meditation'],
    duration: existing.duration,
    level: existing.level || existing.difficulty || 'Beginner',
    approach: existing.approach,
    description: existing.description || '',
    audioUrl: existing.audioUrl || '',
    videoUrl: existing.videoUrl || '',
    youtubeUrl: existing.youtubeUrl || '',
    thumbnailUrl: existing.thumbnailUrl || '',
    tags: existing.tags || '',
    isPublished: existing.isPublished
  } : {
    title:'', types:['Meditation'], duration:10, level:'Beginner', approach:'western', description:'', audioUrl:'', videoUrl:'', youtubeUrl:'', thumbnailUrl:'', tags:'', isPublished:false
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof PracticeInput>(k:K, v: PracticeInput[K]) { setForm(f=> ({ ...f, [k]: v })); }
  function toggleType(t:string){ setForm(f=> ({ ...f, types: f.types.includes(t) ? f.types.filter(x=>x!==t) : [...f.types, t] })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    // client validation
    if (!form.title.trim()) { setError('Title is required'); setSaving(false); return; }
    if (!form.types.length) { setError('Select at least one type'); setSaving(false); return; }
    if (form.duration <= 0) { setError('Duration must be > 0'); setSaving(false); return; }
    try {
      const payload: Record<string, unknown> = { ...form, types: form.types };
      // Clean empty media fields
  const removable = ['audioUrl','videoUrl','youtubeUrl','thumbnailUrl','tags','description'] as const;
  removable.forEach((k) => { if (payload[k] === '') delete payload[k]; });
      const res = await fetch(existing ? `/api/admin/practices/${existing.id}` : '/api/admin/practices', {
        method: existing ? 'PUT' : 'POST',
        headers: { 'Content-Type':'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      const saved: PracticeRecord = data.data || data.practice || data;
      push({ type:'success', message: existing ? 'Practice updated' : 'Practice created' });
      onSaved(saved);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      push({ type:'error', message: msg });
    } finally { setSaving(false); }
  }

  return (
    <div style={{ marginTop:'1rem', padding:'1.25rem', border:'1px solid #d5d5d5', borderRadius:12, boxShadow:'0 4px 10px rgba(0,0,0,0.06)', background:'#fff' }}>
      <h3 style={{ marginTop:0 }}>{existing ? 'Edit Practice' : 'New Practice'}</h3>
      <form onSubmit={submit} style={{ display:'grid', gap:'.5rem', maxWidth:600 }}>
        <input placeholder="Title" value={form.title} onChange={e=>update('title', e.target.value)} required />
        <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
          <fieldset style={{ border:'1px solid #ddd', padding:'.5rem', borderRadius:4 }}>
            <legend style={{ fontSize:12 }}>Types</legend>
            {['Meditation','Breathing','Yoga','Sleep'].map(t=> <label key={t} style={{ marginRight:'0.5rem' }}>
              <input type='checkbox' checked={form.types.includes(t)} onChange={()=>toggleType(t)} /> {t}
            </label>)}
          </fieldset>
          <input type="number" placeholder="Duration" value={form.duration} onChange={e=>update('duration', Number(e.target.value))} required />
          <select value={form.level} onChange={e=>update('level', e.target.value)}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
          <select value={form.approach} onChange={e=>update('approach', e.target.value)}>
            <option value="western">Western</option>
            <option value="eastern">Eastern</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <textarea placeholder="Description" value={form.description} onChange={e=>update('description', e.target.value)} />
        <details style={{ background:'#fafafa', padding:'.5rem .75rem', border:'1px solid #eee', borderRadius:6 }}>
          <summary style={{ cursor:'pointer', fontSize:13, fontWeight:600 }}>Media (optional)</summary>
          <div style={{ display:'grid', gap:'.5rem', marginTop:'.5rem' }}>
            {(form.types.includes('Audio') || form.types.includes('Meditation')) && (
              <input placeholder="Audio URL" value={form.audioUrl} onChange={e=>update('audioUrl', e.target.value)} />
            )}
            {(form.types.includes('Yoga') || form.types.includes('Video')) && (
              <input placeholder="Video URL" value={form.videoUrl} onChange={e=>update('videoUrl', e.target.value)} />
            )}
            {(form.types.includes('Meditation') || form.types.includes('Breathing')) && (
              <input placeholder="YouTube URL" value={form.youtubeUrl} onChange={e=>update('youtubeUrl', e.target.value)} />
            )}
            <input placeholder="Thumbnail URL" value={form.thumbnailUrl} onChange={e=>update('thumbnailUrl', e.target.value)} />
          </div>
        </details>
        <input placeholder="Tags (comma separated)" value={form.tags} onChange={e=>update('tags', e.target.value)} />
        <label><input type="checkbox" checked={form.isPublished} onChange={e=>update('isPublished', e.target.checked)} /> Published</label>
        <div style={{ display:'flex', gap:'.5rem' }}>
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
        {error && <p style={{ color:'red' }}>{error}</p>}
      </form>
    </div>
  );
};
