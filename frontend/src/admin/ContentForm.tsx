import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';


export interface ContentRecord { id:string; title:string; type:string; category?:string; approach:string; content:string; duration?:string|null; difficulty?:string|null; description?:string|null; fileUrl?:string|null; externalUrl?:string|null; thumbnailUrl?:string|null; tags?:string|null; isPublished:boolean; }
interface ContentInput { title:string; description?:string; contentType:string; category?:string; approach:string; body?:string; duration?:string; difficulty?:string; audioUrl?:string; videoUrl?:string; youtubeUrl?:string; imageUrl?:string; thumbnailUrl?:string; tags?:string; isPublished:boolean; }
interface Props { existing?: Partial<ContentRecord>; onSaved:(item:ContentRecord)=>void; onClose:()=>void; }

export const ContentForm: React.FC<Props> = ({ existing, onSaved, onClose }) => {
  const { push } = useToast();
  const [form,setForm]=useState<ContentInput>(existing ? {
    title: existing.title || '',
    description: existing.description || '',
    contentType: existing.type || 'article',
    category: existing.category || 'General',
    approach: existing.approach || 'western',
    body: existing.content || '',
    duration: existing.duration || '',
    difficulty: existing.difficulty || '',
    audioUrl: existing.fileUrl || '',
    videoUrl: existing.fileUrl || '',
    youtubeUrl: existing.externalUrl || '',
    imageUrl: '',
    thumbnailUrl: existing.thumbnailUrl || '',
    tags: existing.tags || '',
    isPublished: existing.isPublished ?? false
  } : { title:'', description:'', contentType:'article', category:'General', approach:'western', body:'', duration:'', difficulty:'', isPublished:false });
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState<string|null>(null);

  function update<K extends keyof ContentInput>(k:K,v:ContentInput[K]){ setForm(f=>({...f,[k]:v})); }

  async function submit(e:React.FormEvent){
    e.preventDefault(); setSaving(true); setError(null);
    if(!form.title.trim()) { setError('Title is required'); setSaving(false); return; }
    if(!form.contentType) { setError('Type is required'); setSaving(false); return; }
    if(!form.approach) { setError('Approach is required'); setSaving(false); return; }
    const hasBody = !!form.body && form.body.trim().length>0;
    const hasMedia = !!(form.audioUrl||form.videoUrl||form.youtubeUrl||form.imageUrl);
    if(!hasBody && !hasMedia){ setError('Provide body text or at least one media URL'); setSaving(false); return; }
    try {
  const payload: Record<string, unknown> = { ...form };
      // remove blanks
      const optional = ['description','body','duration','difficulty','audioUrl','videoUrl','youtubeUrl','imageUrl','thumbnailUrl','tags'] as const;
  optional.forEach(k=>{ if((payload as Record<string,string|undefined>)[k]==='') delete (payload as Record<string,unknown>)[k]; });
      const res = await fetch(existing? `/api/admin/content/${existing.id}` : '/api/admin/content', {
        method: existing? 'PUT':'POST',
        headers:{ 'Content-Type':'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(!data.success) throw new Error(data.error||'Save failed');
      const saved: ContentRecord = data.data || data.content || data;
      push({ type:'success', message: existing? 'Content updated':'Content created' });
      onSaved(saved);
    } catch(err){
      const msg = err instanceof Error? err.message : 'Unknown error';
      setError(msg); push({ type:'error', message: msg });
    } finally { setSaving(false); }
  }

  return <div style={{ marginTop:'1rem', padding:'1.25rem', border:'1px solid #d5d5d5', borderRadius:12, boxShadow:'0 4px 10px rgba(0,0,0,0.06)', background:'#fff' }}>
    <h3 style={{ marginTop:0 }}>{existing? 'Edit Content':'New Content'}</h3>
    <form onSubmit={submit} style={{ display:'grid', gap:'.5rem', maxWidth:650 }}>
      <input placeholder='Title' value={form.title} onChange={e=>update('title',e.target.value)} required />
      <textarea placeholder='Description' value={form.description} onChange={e=>update('description',e.target.value)} />
      <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap' }}>
        <select value={form.contentType} onChange={e=>update('contentType',e.target.value)}>
          <option value='article'>Article</option>
          <option value='story'>Story</option>
          <option value='audio'>Audio</option>
            <option value='video'>Video</option>
        </select>
        <input placeholder='Category' value={form.category||''} onChange={e=>update('category',e.target.value)} style={{ width:130 }} />
        <select value={form.approach} onChange={e=>update('approach',e.target.value)}>
          <option value='western'>Western</option>
          <option value='eastern'>Eastern</option>
          <option value='hybrid'>Hybrid</option>
        </select>
        <input placeholder='Duration (e.g. 10m)' value={form.duration||''} onChange={e=>update('duration',e.target.value)} style={{ width:110 }} />
        <select value={form.difficulty||''} onChange={e=>update('difficulty',e.target.value)}>
          <option value=''>Difficulty</option>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
        <label style={{ display:'flex', alignItems:'center', gap:'.25rem'}}>
          <input type='checkbox' checked={form.isPublished} onChange={e=>update('isPublished',e.target.checked)} /> Published
        </label>
      </div>
      <textarea placeholder='Body / Embed / Notes' value={form.body} onChange={e=>update('body',e.target.value)} />
      <details style={{ background:'#fafafa', padding:'.5rem .75rem', border:'1px solid #eee', borderRadius:6 }}>
        <summary style={{ cursor:'pointer', fontSize:13, fontWeight:600 }}>Media (optional)</summary>
        <div style={{ display:'grid', gap:'.5rem', marginTop:'.5rem' }}>
          {(form.contentType==='audio') && (
            <input placeholder='Audio URL' value={form.audioUrl||''} onChange={e=>update('audioUrl',e.target.value)} />
          )}
          {(form.contentType==='video') && (
            <input placeholder='Video URL' value={form.videoUrl||''} onChange={e=>update('videoUrl',e.target.value)} />
          )}
          {(form.contentType==='video' || form.contentType==='audio') && (
            <input placeholder='YouTube URL (optional)' value={form.youtubeUrl||''} onChange={e=>update('youtubeUrl',e.target.value)} />
          )}
          {(form.contentType==='article' || form.contentType==='story') && (
            <input placeholder='Image URL' value={form.imageUrl||''} onChange={e=>update('imageUrl',e.target.value)} />
          )}
          <input placeholder='Thumbnail URL' value={form.thumbnailUrl||''} onChange={e=>update('thumbnailUrl',e.target.value)} />
        </div>
      </details>
      <input placeholder='Comma tags (relaxation,focus)' value={form.tags||''} onChange={e=>update('tags',e.target.value)} />
      <div style={{ display:'flex', gap:'.5rem' }}>
        <button type='submit' disabled={saving}>{saving? 'Saving...':'Save'}</button>
        <button type='button' onClick={onClose}>Cancel</button>
      </div>
      {error && <p style={{ color:'red'}}>{error}</p>}
    </form>
  </div>;
};
