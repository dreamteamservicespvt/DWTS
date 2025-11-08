import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  arrayUnion,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { uploadMultipleToCloudinary } from '../utils/cloudinaryUpload';
import { 
  Briefcase,
  Filter,
  Search,
  Calendar as CalendarIcon,
  Play,
  Upload,
  Send,
  MessageSquare,
  X,
  Eye,
  Paperclip,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import WorkCard from '../components/WorkCard';
import Loading from '../components/Loading';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const MyWork = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignedWork, setAssignedWork] = useState([]);
  const [filteredWork, setFilteredWork] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWork, setSelectedWork] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [uploadingDeliverable, setUploadingDeliverable] = useState(false);
  const [submissionNote, setSubmissionNote] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(''); // e.g., "Uploading 2 of 5 files..."

  // Fetch assigned work
  useEffect(() => {
    if (!userProfile?.uid) return;

    const q = query(
      collection(db, 'assignedWork'),
      where('assignedTo', 'array-contains', userProfile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssignedWork(workData);
      setFilteredWork(workData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching assigned work:', error);
      toast.error('Failed to load assigned work');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  // Apply filters
  useEffect(() => {
    let filtered = assignedWork;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(work => work.status === filterStatus);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(work =>
        work.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        work.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        work.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredWork(filtered);
  }, [assignedWork, filterStatus, searchQuery]);

  const handleStartWork = async (work) => {
    try {
      const workRef = doc(db, 'assignedWork', work.id);
      await updateDoc(workRef, {
        status: 'In Progress',
        startedAt: serverTimestamp(),
        activityLog: arrayUnion({
          action: 'started',
          by: userProfile.uid,
          byName: userProfile.name,
          timestamp: new Date().toISOString(),
          message: `${userProfile.name} started working`
        })
      });

      toast.success('Work started! Good luck! 💪');
    } catch (error) {
      console.error('Error starting work:', error);
      toast.error('Failed to update status');
    }
  };

  const handleOpenUpload = (work) => {
    setSelectedWork(work);
    setUploadedFiles([]);
    setSubmissionNote('');
    setShowUploadModal(true);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      setUploadingDeliverable(true);
      setUploadProgress(0);
      setUploadStatus(`Preparing to upload ${files.length} file(s)...`);

      // Upload to Cloudinary with progress tracking
      const uploadResults = await uploadMultipleToCloudinary(
        files,
        (progress, current, total) => {
          setUploadProgress(Math.round(progress));
          setUploadStatus(`Uploading ${current} of ${total} files...`);
        },
        {
          folder: `dwts-deliverables/${selectedWork.id}`,
          maxSize: 100 * 1024 * 1024 // 100MB
        }
      );

      // Filter successful uploads
      const successfulUploads = uploadResults.filter(result => result.success);
      const failedUploads = uploadResults.filter(result => !result.success);

      if (successfulUploads.length > 0) {
        setUploadedFiles(prev => [...prev, ...successfulUploads]);
        toast.success(`✅ ${successfulUploads.length} file(s) uploaded successfully`);
      }

      if (failedUploads.length > 0) {
        toast.error(`❌ ${failedUploads.length} file(s) failed to upload`);
        console.error('Failed uploads:', failedUploads);
      }

      setUploadStatus('');
      setUploadProgress(0);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(error.message || 'Upload failed. Please try again.');
      setUploadStatus('');
      setUploadProgress(0);
    } finally {
      setUploadingDeliverable(false);
    }
  };

  const handleSubmitWork = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one deliverable');
      return;
    }

    try {
      const workRef = doc(db, 'assignedWork', selectedWork.id);
      
      const submission = {
        files: uploadedFiles,
        note: submissionNote,
        submittedBy: userProfile.uid,
        submittedByName: userProfile.name,
        submittedAt: new Date().toISOString()
      };

      await updateDoc(workRef, {
        status: 'Submitted',
        submissions: arrayUnion(submission),
        submittedAt: serverTimestamp(),
        activityLog: arrayUnion({
          action: 'submitted',
          by: userProfile.uid,
          byName: userProfile.name,
          timestamp: new Date().toISOString(),
          message: `${userProfile.name} submitted work for review`,
          filesCount: uploadedFiles.length
        })
      });

      // Create notification for admin
      await addDoc(collection(db, 'notifications'), {
        userId: selectedWork.assignedBy,
        type: 'work_submitted',
        title: 'Work Submitted for Review',
        message: `${userProfile.name} submitted: ${selectedWork.title}`,
        workId: selectedWork.id,
        read: false,
        createdAt: serverTimestamp()
      });

      toast.success(`Submitted to ${selectedWork.assignedByName} for review.`);
      setShowUploadModal(false);
      setUploadedFiles([]);
      setSubmissionNote('');
    } catch (error) {
      console.error('Error submitting work:', error);
      toast.error('Failed to submit. Please try again.');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      const workRef = doc(db, 'assignedWork', selectedWork.id);
      
      const comment = {
        text: commentText,
        by: userProfile.uid,
        byName: userProfile.name,
        byPhoto: userProfile.photoURL,
        timestamp: new Date().toISOString()
      };

      await updateDoc(workRef, {
        comments: arrayUnion(comment),
        activityLog: arrayUnion({
          action: 'commented',
          by: userProfile.uid,
          byName: userProfile.name,
          timestamp: new Date().toISOString(),
          message: `${userProfile.name} added a comment`
        })
      });

      toast.success('Comment added');
      setCommentText('');
      setShowCommentModal(false);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleViewDetails = (work) => {
    setSelectedWork(work);
    setShowDetailModal(true);
  };

  const stats = {
    total: assignedWork.length,
    pending: assignedWork.filter(w => w.status === 'Pending').length,
    inProgress: assignedWork.filter(w => w.status === 'In Progress').length,
    submitted: assignedWork.filter(w => w.status === 'Submitted').length,
    rework: assignedWork.filter(w => w.status === 'Rework').length,
    completed: assignedWork.filter(w => w.status === 'Completed').length
  };

  if (loading) {
    return <Loading message="Loading your work..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">My Work</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your assigned work and deliverables
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total" value={stats.total} color="from-blue-400 to-cyan-500" />
        <StatCard label="Pending" value={stats.pending} color="from-gray-400 to-gray-500" />
        <StatCard label="In Progress" value={stats.inProgress} color="from-blue-400 to-blue-500" />
        <StatCard label="Submitted" value={stats.submitted} color="from-purple-400 to-purple-500" />
        <StatCard label="Rework" value={stats.rework} color="from-orange-400 to-orange-500" />
        <StatCard label="Completed" value={stats.completed} color="from-green-400 to-green-500" />
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search work..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select-field"
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted">Submitted</option>
            <option value="Rework">Rework</option>
            <option value="Completed">Completed</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Work List */}
      {filteredWork.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredWork.map((work, idx) => (
            <WorkCard
              key={work.id}
              work={work}
              onClick={() => handleViewDetails(work)}
              onStart={handleStartWork}
              onUpload={handleOpenUpload}
              onSubmit={handleOpenUpload}
              onComment={() => {
                setSelectedWork(work);
                setShowCommentModal(true);
              }}
              delay={idx * 0.05}
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 rounded-2xl text-center"
        >
          <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No work found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'You have no assigned work yet. Check back later!'}
          </p>
        </motion.div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && selectedWork && (
          <UploadModal
            work={selectedWork}
            onClose={() => {
              setShowUploadModal(false);
              setUploadedFiles([]);
              setSubmissionNote('');
              setUploadProgress(0);
              setUploadStatus('');
            }}
            uploadedFiles={uploadedFiles}
            onFileUpload={handleFileUpload}
            uploading={uploadingDeliverable}
            uploadProgress={uploadProgress}
            uploadStatus={uploadStatus}
            submissionNote={submissionNote}
            setSubmissionNote={setSubmissionNote}
            onSubmit={handleSubmitWork}
            removeFile={(index) => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
          />
        )}
      </AnimatePresence>

      {/* Comment Modal */}
      <AnimatePresence>
        {showCommentModal && selectedWork && (
          <CommentModal
            work={selectedWork}
            onClose={() => {
              setShowCommentModal(false);
              setCommentText('');
            }}
            commentText={commentText}
            setCommentText={setCommentText}
            onSubmit={handleAddComment}
          />
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedWork && (
          <WorkDetailModal
            work={selectedWork}
            onClose={() => setShowDetailModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="glass-card p-4 rounded-xl"
  >
    <div className={`w-full h-2 bg-gradient-to-r ${color} rounded-full mb-3`} />
    <p className="text-2xl font-bold mb-1">{value}</p>
    <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
  </motion.div>
);

const UploadModal = ({ 
  work, 
  onClose, 
  uploadedFiles, 
  onFileUpload, 
  uploading, 
  uploadProgress,
  uploadStatus,
  submissionNote, 
  setSubmissionNote, 
  onSubmit,
  removeFile
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      className="glass-premium rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Upload Deliverable</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <p className="font-semibold mb-1">{work.title}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{work.taskType}</p>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-semibold mb-2">Upload Files</label>
          
          {/* Upload Progress */}
          {uploading && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {uploadStatus}
                </span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="mb-3 space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-sm font-medium block">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg"
                    disabled={uploading}
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium">{uploading ? 'Uploading...' : 'Click to upload deliverables'}</p>
              <p className="text-xs text-gray-500 mt-1">Videos, images, documents, etc. (max 100MB per file)</p>
            </div>
            <input
              type="file"
              multiple
              onChange={onFileUpload}
              className="hidden"
              disabled={uploading}
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
            />
          </label>
        </div>

        {/* Submission Note */}
        <div>
          <label className="block text-sm font-semibold mb-2">Submission Note (optional)</label>
          <textarea
            value={submissionNote}
            onChange={(e) => setSubmissionNote(e.target.value)}
            className="input-field resize-none"
            rows={4}
            placeholder="Add any notes or comments about your submission..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSubmit}
            disabled={uploadedFiles.length === 0}
            className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Send className="w-5 h-5" />
            <span>Submit for Review</span>
          </motion.button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

const CommentModal = ({ work, onClose, commentText, setCommentText, onSubmit }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      className="glass-premium rounded-3xl p-8 max-w-lg w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Add Comment</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
          <X className="w-6 h-6" />
        </button>
      </div>

      <textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        className="input-field resize-none mb-4"
        rows={5}
        placeholder="Add your comment or question..."
        autoFocus
      />

      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSubmit}
          className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl"
        >
          Add Comment
        </motion.button>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-xl font-semibold"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const WorkDetailModal = ({ work, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      className="glass-premium rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Work Details</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Title & Status */}
        <div>
          <h3 className="text-2xl font-bold mb-2">{work.title}</h3>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold">
              {work.taskType}
            </span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-semibold">
              {work.status}
            </span>
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm font-semibold">
              {work.priority} Priority
            </span>
          </div>
        </div>

        {/* Description */}
        {work.description && (
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{work.description}</p>
          </div>
        )}

        {/* Client/Project */}
        {(work.clientName || work.projectName) && (
          <div>
            <h4 className="font-semibold mb-2">Client & Project</h4>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              {work.clientName && <p className="font-medium">{work.clientName}</p>}
              {work.projectName && <p className="text-sm text-gray-600 dark:text-gray-400">{work.projectName}</p>}
            </div>
          </div>
        )}

        {/* Attachments */}
        {work.attachments && work.attachments.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Reference Attachments</h4>
            <div className="space-y-2">
              {work.attachments.map((file, index) => (
                <a
                  key={index}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">{file.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Activity Log */}
        {work.activityLog && work.activityLog.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Activity Log</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {work.activityLog.map((log, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm">
                  <p className="font-medium">{log.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {format(new Date(log.timestamp), 'MMM dd, yyyy hh:mm a')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  </motion.div>
);

export default MyWork;
