/**
 * ファイル保存ユーティリティ（Supabase Storage）
 */

import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'task-attachments';

/**
 * ファイルをSupabase Storageにアップロード
 * @param {File} file - アップロードするファイル
 * @param {string} taskId - タスクID
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadFile = async (file, taskId) => {
  try {
    const timestamp = Date.now();

    // ファイル拡張子を取得
    const fileExtension = file.name.includes('.')
      ? file.name.split('.').pop()
      : 'bin';

    // ASCII安全なファイル名を生成（日本語文字を含まない）
    const randomString = Math.random().toString(36).substring(2, 10);
    const safeFileName = `${timestamp}_${randomString}.${fileExtension}`;
    const fileName = `${taskId}/${safeFileName}`;

    console.log('🔵 Original file name:', file.name);
    console.log('🟢 Safe storage name:', safeFileName);
    console.log('🟡 Full path:', fileName);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl,
      path: fileName,
      originalName: file.name  // 元のファイル名を保持
    };
  } catch (error) {
    console.error('ファイルアップロードエラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * ファイルをSupabase Storageから削除
 * @param {string} filePath - ファイルパス
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteFile = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('ファイル削除エラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * ファイルをダウンロード
 * @param {string} url - ファイルURL
 * @param {string} fileName - ファイル名
 */
export const downloadFile = (url, fileName) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * ファイルサイズをフォーマット
 * @param {number} bytes - バイト数
 * @returns {string} フォーマットされたファイルサイズ
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
