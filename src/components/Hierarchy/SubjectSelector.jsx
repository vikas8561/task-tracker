import CustomDropdown from './CustomDropdown';
import { createSubject } from '../../hooks/useSubjects';
import toast from 'react-hot-toast';

export default function SubjectSelector({ subjects, value, onChange, onSubjectCreated }) {
  async function handleCreate(name, color) {
    try {
      const subject = await createSubject(name, color);
      onSubjectCreated(subject);
      return subject;
    } catch {
      toast.error('Failed to create subject');
      throw new Error();
    }
  }

  return (
    <CustomDropdown
      id="subject-dd"
      items={subjects}
      value={value}
      onChange={onChange}
      placeholder="Choose a subject…"
      onCreate={handleCreate}
      colorPicker
    />
  );
}
