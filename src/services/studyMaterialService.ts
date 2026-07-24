import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StudyMaterial, StudyMaterialStatus, StudyMaterialType } from '../types';
import { SEED_STUDY_MATERIALS } from '../data';

const COLLECTION_NAME = 'study_materials';

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Fetch all study materials (Firestore with local fallback)
 */
export async function getStudyMaterials(): Promise<StudyMaterial[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    if (!querySnapshot.empty) {
      const items: StudyMaterial[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as StudyMaterial;
        items.push({
          ...data,
          id: docSnap.id,
          materialId: data.materialId || docSnap.id,
          desc: data.description || data.desc || '',
          file: data.file || data.fileUrl || '',
          category: data.category || (data.materialType === 'NOTES' ? 'NOTES' : 'QUESTION_PAPER')
        });
      });
      return items;
    }
  } catch (err) {
    console.warn('Firestore study_materials fetch error, using fallback seed data:', err);
  }
  return SEED_STUDY_MATERIALS;
}

/**
 * Fetch public published study materials for website visitors
 */
export async function getPublicStudyMaterials(): Promise<StudyMaterial[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('isPublic', '==', true),
      where('status', '==', 'PUBLISHED')
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const items: StudyMaterial[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as StudyMaterial;
        items.push({
          ...data,
          id: docSnap.id,
          materialId: data.materialId || docSnap.id
        });
      });
      return items;
    }
  } catch (err) {
    console.warn('Error fetching public study materials from Firestore:', err);
  }
  return SEED_STUDY_MATERIALS.filter((m) => m.isPublic && m.status === 'PUBLISHED');
}

/**
 * Create or save a new study material
 */
export async function createStudyMaterial(
  materialData: Omit<StudyMaterial, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount' | 'viewCount'> & {
    id?: string;
  }
): Promise<StudyMaterial> {
  const newId = materialData.id || `mat-${Date.now()}`;
  const now = new Date().toISOString();
  const slug = materialData.slug || generateSlug(materialData.title);

  const fullMaterial: StudyMaterial = {
    id: newId,
    materialId: newId,
    title: materialData.title,
    slug,
    description: materialData.description || materialData.desc || '',
    desc: materialData.description || materialData.desc || '',
    class: materialData.class,
    subject: materialData.subject,
    chapter: materialData.chapter || '',
    materialType: materialData.materialType || 'NOTES',
    category: materialData.category || 'NOTES',
    file: materialData.file || '',
    size: materialData.size || '1.0 MB',
    fileUrl: materialData.fileUrl || '',
    thumbnailUrl: materialData.thumbnailUrl || '',
    youtubeUrl: materialData.youtubeUrl || '',
    externalUrl: materialData.externalUrl || '',
    fileData: materialData.fileData || '',
    isPublic: materialData.isPublic !== undefined ? materialData.isPublic : true,
    status: materialData.status || 'PUBLISHED',
    downloadCount: 0,
    viewCount: 0,
    tags: materialData.tags || [],
    seoTitle: materialData.seoTitle || `${materialData.title} PDF - Sunshine Classes`,
    metaDescription: materialData.metaDescription || materialData.description || materialData.title,
    keywords: materialData.keywords || materialData.tags || [],
    createdBy: materialData.createdBy || 'Admin',
    uploadedBy: materialData.uploadedBy || materialData.createdBy || 'Admin',
    createdAt: now,
    updatedAt: now,
    date: materialData.date || now.split('T')[0]
  };

  try {
    await setDoc(doc(db, COLLECTION_NAME, newId), fullMaterial);
  } catch (err) {
    console.error('Error saving study material to Firestore:', err);
  }

  return fullMaterial;
}

/**
 * Update an existing study material
 */
export async function updateStudyMaterial(
  id: string,
  updates: Partial<StudyMaterial>
): Promise<void> {
  const now = new Date().toISOString();
  const payload = {
    ...updates,
    updatedAt: now
  };

  if (updates.title && !updates.slug) {
    payload.slug = generateSlug(updates.title);
  }

  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), payload);
  } catch (err) {
    console.error(`Error updating study material ${id} in Firestore:`, err);
  }
}

/**
 * Delete a study material by ID
 */
export async function deleteStudyMaterial(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (err) {
    console.error(`Error deleting study material ${id} from Firestore:`, err);
  }
}

/**
 * Bulk delete study materials
 */
export async function bulkDeleteStudyMaterials(ids: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    ids.forEach((id) => {
      batch.delete(doc(db, COLLECTION_NAME, id));
    });
    await batch.commit();
  } catch (err) {
    console.error('Error bulk deleting study materials:', err);
  }
}

/**
 * Bulk update status (Publish / Unpublish / Archive)
 */
export async function bulkUpdateStatus(
  ids: string[],
  status: StudyMaterialStatus,
  isPublic?: boolean
): Promise<void> {
  const now = new Date().toISOString();
  try {
    const batch = writeBatch(db);
    ids.forEach((id) => {
      const ref = doc(db, COLLECTION_NAME, id);
      const updateData: any = { status, updatedAt: now };
      if (isPublic !== undefined) {
        updateData.isPublic = isPublic;
      }
      batch.update(ref, updateData);
    });
    await batch.commit();
  } catch (err) {
    console.error('Error bulk updating status:', err);
  }
}

/**
 * Increment view count
 */
export async function incrementViewCount(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      viewCount: increment(1)
    });
  } catch (err) {
    console.warn(`Could not increment view count for ${id}:`, err);
  }
}

/**
 * Increment download count and set lastDownloaded
 */
export async function incrementDownloadCount(id: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, COLLECTION_NAME, id), {
      downloadCount: increment(1),
      lastDownloaded: now
    });
  } catch (err) {
    console.warn(`Could not increment download count for ${id}:`, err);
  }
}
