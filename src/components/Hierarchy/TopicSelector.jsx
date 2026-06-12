import CustomDropdown from './CustomDropdown';
import { createTopic } from '../../hooks/useTopics';
import toast from 'react-hot-toast';

export default function TopicSelector({ topics, value, onChange, chapterId, onTopicCreated, accentColor }) {
  async function handleCreate(name) {
    try {
      const topic = await createTopic(chapterId, name);
      onTopicCreated(topic);
      return topic;
    } catch {
      toast.error('Failed to create topic');
      throw new Error();
    }
  }

  return (
    <CustomDropdown
      id="topic-dd"
      items={topics}
      value={value}
      onChange={onChange}
      placeholder="Choose a topic…"
      onCreate={handleCreate}
      accentColor={accentColor}
    />
  );
}
