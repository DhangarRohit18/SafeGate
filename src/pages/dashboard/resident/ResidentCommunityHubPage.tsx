import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { amenityService } from '../../../services/amenityService';
import type {
  CommunityAnnouncement,
  CommunityEvent,
  CommunityPoll,
  CommunityPost,
  RSVPStatus
} from '../../../types/amenity';
import { Modal } from '../../../components/ui/Modal';
import { CommunityMarketplaceHub } from '../../../domains/community';
import {
  Megaphone,
  Calendar,
  Vote,
  MessageSquare,
  Pin,
  ThumbsUp,
  Send,
  Plus,
  Users,
  MapPin,
  Clock,
  Tag,
  ArrowLeft,
} from 'lucide-react';

export const ResidentCommunityHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const societyId = (currentUser as any)?.societyId || 'soc-1';
  const residentId = currentUser?.id || 'res-1';
  const residentName = currentUser?.name || 'Sarvesh Kulkarni';
  const flatNumber = (currentUser as any)?.flatDetails || (currentUser as any)?.flatNumber || 'B-1204';

  const [activeTab, setActiveTab] = useState<'ANNOUNCEMENTS' | 'EVENTS' | 'POLLS' | 'POSTS'>('ANNOUNCEMENTS');

  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [polls, setPolls] = useState<CommunityPoll[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  // Modals state
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);

  // Post form
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<CommunityPost['category']>('GENERAL');

  // Event form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDate, setEventDate] = useState('');

  // Poll form
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollDesc, setPollDesc] = useState('');
  const [pollOptions, setPollOptions] = useState(['Yes', 'No']);
  const [pollExpires, setPollExpires] = useState('');

  // Comment state
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  useEffect(() => {
    loadData();
  }, [societyId]);

  const loadData = () => {
    setAnnouncements(amenityService.getAnnouncements(societyId));
    setEvents(amenityService.getEvents(societyId));
    setPolls(amenityService.getPolls(societyId));
    setPosts(amenityService.getPosts(societyId));
  };

  const handleRSVP = (eventId: string, status: RSVPStatus, guestsCount: number) => {
    amenityService.rsvpEvent(societyId, eventId, residentId, residentName, flatNumber, status, guestsCount);
    loadData();
  };

  const handleVotePoll = (pollId: string, optionId: string) => {
    amenityService.votePoll(societyId, pollId, optionId, residentId);
    loadData();
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    amenityService.createPost(societyId, residentId, residentName, flatNumber, postContent, postCategory);
    setShowCreatePostModal(false);
    setPostContent('');
    loadData();
  };

  const handleToggleLike = (postId: string) => {
    amenityService.toggleLikePost(societyId, postId, residentId);
    loadData();
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    amenityService.addCommentPost(societyId, postId, residentName, flatNumber, text);
    setCommentInputs({ ...commentInputs, [postId]: '' });
    loadData();
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDate) return;

    amenityService.createEvent(societyId, eventTitle, eventDesc, eventLocation, eventDate, residentName);
    setShowCreateEventModal(false);
    setEventTitle('');
    setEventDesc('');
    setEventLocation('');
    setEventDate('');
    loadData();
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollQuestion || pollOptions.filter(o => o.trim()).length < 2) return;

    amenityService.createPoll(societyId, pollQuestion, pollDesc, pollOptions.filter(o => o.trim()), pollExpires || '2026-12-31', residentName);
    setShowCreatePollModal(false);
    setPollQuestion('');
    setPollDesc('');
    setPollOptions(['Yes', 'No']);
    loadData();
  };

  return (
    <div style={{ background: '#F7FBFE', minHeight: '100vh', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-44 space-y-4">
        
        {/* Header Card (Exact Coral & Navy Light Design System) */}
        <div
          style={{
            background: 'var(--aarizo-card-bg, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--aarizo-border, #DCE8EF)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <button
              onClick={() => navigate(-1)}
              aria-label="Back"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: '#ffffff',
                border: '1px solid var(--aarizo-border, #DCE8EF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--aarizo-navy, #083B56)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aarizo-navy, #083B56)', margin: 0, letterSpacing: '-0.02em' }}>
                Community &amp; Discussion Hub
              </h1>
              <p style={{ fontSize: '0.6875rem', color: 'var(--aarizo-text-secondary, #657785)', margin: 0, marginTop: 2 }}>
                Green Valley Society · Official announcements, events, resident polls &amp; neighborhood forums
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {activeTab === 'POSTS' && (
              <button
                onClick={() => setShowCreatePostModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 0.875rem',
                  borderRadius: '10px',
                  background: 'var(--aarizo-coral, #F06543)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Plus size={15} /> Create Post
              </button>
            )}
            {activeTab === 'EVENTS' && (
              <button
                onClick={() => setShowCreateEventModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 0.875rem',
                  borderRadius: '10px',
                  background: 'var(--aarizo-coral, #F06543)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Plus size={15} /> Propose Event
              </button>
            )}
            {activeTab === 'POLLS' && (
              <button
                onClick={() => setShowCreatePollModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 0.875rem',
                  borderRadius: '10px',
                  background: 'var(--aarizo-coral, #F06543)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(240, 101, 67, 0.25)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Plus size={15} /> Create Poll
              </button>
            )}
          </div>
        </div>

        {/* Coral Pill Tabs Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: 'ANNOUNCEMENTS', label: 'Announcements', count: announcements.length, icon: Megaphone },
            { key: 'EVENTS', label: 'Events & RSVP', count: events.length, icon: Calendar },
            { key: 'POLLS', label: 'Polls', count: polls.length, icon: Vote },
            { key: 'POSTS', label: 'Neighbor Feed', count: posts.length, icon: MessageSquare },
            { key: 'DIRECTORY', label: 'Directory & Skills', icon: Users },
            { key: 'LOST_FOUND', label: 'Lost & Found', icon: Tag },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === (tab.key as any);
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.875rem',
                  borderRadius: '12px',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  background: isActive ? 'var(--aarizo-coral, #F06543)' : '#ffffff',
                  color: isActive ? '#ffffff' : '#083B56',
                  border: isActive ? '1px solid #F06543' : '1px solid #DCE8EF',
                  boxShadow: isActive ? '0 2px 8px rgba(240, 101, 67, 0.25)' : 'none',
                }}
              >
                <Icon size={15} style={{ color: isActive ? '#ffffff' : '#F06543' }} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 900,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '10px',
                      background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#F0654315',
                      color: isActive ? '#ffffff' : '#F06543',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: ANNOUNCEMENTS */}
        {activeTab === 'ANNOUNCEMENTS' && (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #DCE8EF',
                  borderLeft: ann.isPinned ? '4px solid #F06543' : '4px solid #083B56',
                  padding: '1.25rem',
                  boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {ann.isPinned && <Pin size={14} style={{ color: '#F06543', fill: '#F06543' }} />}
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        padding: '0.25rem 0.6rem',
                        borderRadius: '8px',
                        background:
                          ann.category === 'IMPORTANT'
                            ? '#FFF0F1'
                            : ann.category === 'MAINTENANCE'
                            ? '#FFF8E8'
                            : '#EAF6FC',
                        color:
                          ann.category === 'IMPORTANT'
                            ? '#D9535B'
                            : ann.category === 'MAINTENANCE'
                            ? '#D99A2B'
                            : '#083B56',
                        border:
                          ann.category === 'IMPORTANT'
                            ? '1px solid #FECACA'
                            : ann.category === 'MAINTENANCE'
                            ? '1px solid #FDE68A'
                            : '1px solid #DCE8EF',
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {ann.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#657785', fontWeight: 600 }}>
                      By {ann.authorName}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 500 }}>
                    {new Date(ann.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#083B56', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
                  {ann.title}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: EVENTS */}
        {activeTab === 'EVENTS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map(evt => {
              const userRsvp = evt.rsvps.find(r => r.residentId === residentId);
              const totalGoing = evt.rsvps.filter(r => r.status === 'GOING').reduce((acc, curr) => acc + 1 + curr.guestsCount, 0);

              return (
                <div
                  key={evt.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #DCE8EF',
                    padding: '1.25rem',
                    boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ padding: '0.25rem 0.65rem', background: '#F8FAFC', color: '#083B56', fontSize: '0.75rem', fontWeight: 800, borderRadius: '8px', border: '1px solid #DCE8EF' }}>
                        Organizer: {evt.organizerName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Users size={14} /> {totalGoing} Attending
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#083B56', margin: '0 0 0.5rem 0' }}>{evt.title}</h3>
                    <p style={{ color: '#475569', fontSize: '0.8125rem', margin: '0 0 1rem 0', lineHeight: 1.5 }}>{evt.description}</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem', color: '#657785', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={14} style={{ color: '#F06543' }} />
                        <span>{evt.eventDate}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={14} style={{ color: '#083B56' }} />
                        <span>{evt.location}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: '0.875rem', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#657785' }}>
                      Status: <strong style={{ color: '#083B56' }}>{userRsvp ? userRsvp.status : 'Not Responded'}</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleRSVP(evt.id, 'GOING', 0)}
                        style={{
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: userRsvp?.status === 'GOING' ? '#059669' : '#FFFFFF',
                          color: userRsvp?.status === 'GOING' ? '#FFFFFF' : '#059669',
                          border: userRsvp?.status === 'GOING' ? '1px solid #059669' : '1px solid #A7F3D0',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Going
                      </button>
                      <button
                        onClick={() => handleRSVP(evt.id, 'MAYBE', 0)}
                        style={{
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: userRsvp?.status === 'MAYBE' ? '#D97706' : '#FFFFFF',
                          color: userRsvp?.status === 'MAYBE' ? '#FFFFFF' : '#D97706',
                          border: userRsvp?.status === 'MAYBE' ? '1px solid #D97706' : '1px solid #FDE68A',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Maybe
                      </button>
                      <button
                        onClick={() => handleRSVP(evt.id, 'NOT_GOING', 0)}
                        style={{
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: userRsvp?.status === 'NOT_GOING' ? '#DC2626' : '#FFFFFF',
                          color: userRsvp?.status === 'NOT_GOING' ? '#FFFFFF' : '#DC2626',
                          border: userRsvp?.status === 'NOT_GOING' ? '1px solid #DC2626' : '1px solid #FECACA',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: POLLS */}
        {activeTab === 'POLLS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {polls.map(poll => {
              const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes.length, 0);

              return (
                <div key={poll.id} style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem', boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#657785', fontWeight: 600 }}>
                    <span>Created by {poll.createdBy}</span>
                    <span>Expires: {poll.expiresAt}</span>
                  </div>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#083B56', marginTop: '0.5rem', margin: '0.5rem 0 0.25rem' }}>{poll.question}</h3>
                  {poll.description && <p style={{ fontSize: '0.8125rem', color: '#657785', margin: 0 }}>{poll.description}</p>}

                  <div className="mt-4 space-y-2.5">
                    {poll.options.map(opt => {
                      const optionVotes = opt.votes.length;
                      const percent = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                      const isVoted = opt.votes.includes(residentId);

                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleVotePoll(poll.id, opt.id)}
                          style={{
                            padding: '0.75rem',
                            borderRadius: '12px',
                            border: isVoted ? '2px solid #F06543' : '1px solid #DCE8EF',
                            background: isVoted ? '#FFF5F2' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, color: '#083B56' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="radio"
                                name={`poll-${poll.id}`}
                                checked={isVoted}
                                onChange={() => {}}
                                style={{ accentColor: '#F06543' }}
                              />
                              {opt.text}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#657785' }}>{percent}% ({optionVotes} votes)</span>
                          </div>
                          <div style={{ width: '100%', background: '#E2E8F0', borderRadius: '9999px', height: '6px', marginTop: '0.5rem', overflow: 'hidden' }}>
                            <div style={{ background: 'var(--aarizo-coral, #F06543)', height: '100%', borderRadius: '9999px', width: `${percent}%`, transition: 'all 0.3s ease' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: POSTS / FEED */}
        {activeTab === 'POSTS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map(post => (
              <div key={post.id} style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #DCE8EF', padding: '1.25rem', boxShadow: '0 1px 4px rgba(8, 59, 86, 0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#F8FAFC', color: '#083B56', border: '1px solid #DCE8EF', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>
                      {post.authorName.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#083B56', margin: 0 }}>{post.authorName}</h4>
                      <p style={{ fontSize: '0.75rem', color: '#657785', margin: 0 }}>Flat {post.flatNumber} · {new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span style={{ padding: '0.25rem 0.6rem', background: '#F8FAFC', color: '#083B56', fontSize: '0.6875rem', fontWeight: 800, borderRadius: '8px', border: '1px solid #DCE8EF', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Tag size={12} /> {post.category}
                  </span>
                </div>

                <p style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.875rem', lineHeight: 1.5 }}>{post.content}</p>

                <div style={{ marginTop: '0.875rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#657785' }}>
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, color: post.likes.includes(residentId) ? '#F06543' : '#657785', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <ThumbsUp size={14} /> {post.likes.length} Likes
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                    <MessageSquare size={14} /> {post.comments.length} Comments
                  </span>
                </div>

                {/* Comments Section */}
                {post.comments.length > 0 && (
                  <div style={{ marginTop: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.65rem', borderRadius: '10px' }} className="space-y-1.5">
                    {post.comments.map(c => (
                      <div key={c.id} style={{ fontSize: '0.75rem' }}>
                        <strong style={{ color: '#083B56' }}>{c.authorName} ({c.flatNumber}): </strong>
                        <span style={{ color: '#475569' }}>{c.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Input */}
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={commentInputs[post.id] || ''}
                    onChange={e => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                    style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.75rem', border: '1px solid #DCE8EF', borderRadius: '8px', outline: 'none' }}
                  />
                  <button
                    onClick={() => handleAddComment(post.id)}
                    style={{ padding: '0.45rem 0.75rem', background: '#083B56', color: '#ffffff', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
                  >
                    <Send size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: DIRECTORY */}
        {(activeTab as string) === 'DIRECTORY' && (
          <CommunityMarketplaceHub userRole="RESIDENT" initialTab="DIRECTORY" hideHeaderBanner={true} hideTabs={true} />
        )}

        {/* TAB 6: LOST & FOUND */}
        {(activeTab as string) === 'LOST_FOUND' && (
          <CommunityMarketplaceHub userRole="RESIDENT" initialTab="LOST_FOUND" hideHeaderBanner={true} hideTabs={true} />
        )}

        {/* Modal: Create Post */}
        <Modal isOpen={showCreatePostModal} onClose={() => setShowCreatePostModal(false)} title="Create Neighbor Post">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={postCategory}
                onChange={e => setPostCategory(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="GENERAL">General Discussion</option>
                <option value="RECOMMENDATION">Vendor / Worker Recommendation</option>
                <option value="BUY_SELL">Buy &amp; Sell / Marketplace</option>
                <option value="NEIGHBORHOOD">Neighborhood Alert</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Post Content</label>
              <textarea
                rows={4}
                required
                placeholder="What would you like to share with society residents?"
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreatePostModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-semibold rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#F06543] text-white font-bold text-sm rounded-lg shadow-sm">Publish Post</button>
            </div>
          </form>
        </Modal>

        {/* Modal: Propose Event */}
        <Modal isOpen={showCreateEventModal} onClose={() => setShowCreateEventModal(false)} title="Propose Society Event">
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Diwali Rangoli Competition"
                value={eventTitle}
                onChange={e => setEventTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={eventDesc}
                onChange={e => setEventDesc(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clubhouse Terrace"
                  value={eventLocation}
                  onChange={e => setEventLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date &amp; Time</label>
                <input
                  type="datetime-local"
                  required
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreateEventModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-semibold rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#F06543] text-white font-bold text-sm rounded-lg shadow-sm">Publish Event</button>
            </div>
          </form>
        </Modal>

        {/* Modal: Create Poll */}
        <Modal isOpen={showCreatePollModal} onClose={() => setShowCreatePollModal(false)} title="Create Resident Poll">
          <form onSubmit={handleCreatePoll} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Question</label>
              <input
                type="text"
                required
                placeholder="e.g. Should we organize a weekend yoga class?"
                value={pollQuestion}
                onChange={e => setPollQuestion(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Poll Expiry Date</label>
              <input
                type="date"
                value={pollExpires}
                onChange={e => setPollExpires(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Poll Options</label>
              {pollOptions.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  required
                  value={opt}
                  onChange={e => {
                    const updated = [...pollOptions];
                    updated[idx] = e.target.value;
                    setPollOptions(updated);
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
                  placeholder={`Option ${idx + 1}`}
                />
              ))}
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ''])}
                className="px-3 py-1.5 text-[#F06543] border border-[#F06543]/30 hover:bg-[#FFF5F2] text-xs font-extrabold rounded-lg mt-1"
              >
                + Add Option
              </button>
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreatePollModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-semibold rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#F06543] text-white font-bold text-sm rounded-lg shadow-sm">Create Poll</button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default ResidentCommunityHubPage;
