'use client';
import { useState, useCallback } from 'react';
import type { ModalItem } from '@/components/RatingModal';

/**
 * Manages RatingModal + AlbumView state.
 * When an album is clicked, open AlbumView.
 * When a song is clicked (or "Rate Album" inside AlbumView), open RatingModal.
 */
export function useModals() {
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [albumView, setAlbumView] = useState<ModalItem | null>(null);
  const [albumOpen, setAlbumOpen] = useState(false);

  const openItem = useCallback((item: ModalItem) => {
    if (item.type === 'album') {
      // Open album tracklist view
      setAlbumView(item);
      setAlbumOpen(true);
    } else {
      // Open rating modal for songs
      setModalItem(item);
      setModalOpen(true);
    }
  }, []);

  const openRating = useCallback((item: ModalItem) => {
    setModalItem(item);
    setModalOpen(true);
  }, []);

  const openAlbum = useCallback((item: ModalItem) => {
    setAlbumView(item);
    setAlbumOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);
  const closeAlbum = useCallback(() => setAlbumOpen(false), []);

  // From AlbumView: click a song → open rating (leave album open? or close?)
  const onAlbumSongClick = useCallback((item: ModalItem) => {
    if (item.type === 'album') {
      // "Rate Album" button — open rating modal for the album itself
      setAlbumOpen(false);
      setTimeout(() => { setModalItem(item); setModalOpen(true); }, 200);
    } else {
      // Song click — open rating modal
      setModalItem(item);
      setModalOpen(true);
    }
  }, []);

  // From recs inside album view: open a different album
  const onAlbumRecClick = useCallback((item: ModalItem) => {
    setAlbumOpen(false);
    setTimeout(() => { setAlbumView(item); setAlbumOpen(true); }, 200);
  }, []);

  // From recs inside rating modal: open album
  const onModalAlbumClick = useCallback((item: ModalItem) => {
    setModalOpen(false);
    setTimeout(() => {
      if (item.type === 'album') { setAlbumView(item); setAlbumOpen(true); }
      else { setModalItem(item); setModalOpen(true); }
    }, 200);
  }, []);

  return {
    modalItem, modalOpen, closeModal,
    albumView, albumOpen, closeAlbum,
    openItem, openRating, openAlbum,
    onAlbumSongClick, onAlbumRecClick, onModalAlbumClick,
  };
}
