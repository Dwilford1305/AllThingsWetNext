import { randomUUID } from 'crypto';
import type { Discussion, DiscussionComment } from '@/types';

describe('Discussion Types and Structure', () => {
  test('Discussion type structure is correct', () => {
    // Create a sample discussion object
    const discussion: Discussion = {
      id: `discussion_${randomUUID()}`,
      title: 'Test Discussion',
      content: 'This is a test discussion content',
      author: 'user_123',
      comments: [
        {
          id: `comment_${randomUUID()}`,
          content: 'Test comment',
          author: 'user_456',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate the structure
    expect(discussion.id).toMatch(/^discussion_/);
    expect(discussion.title).toBe('Test Discussion');
    expect(discussion.content).toBe('This is a test discussion content');
    expect(discussion.author).toBe('user_123');
    expect(Array.isArray(discussion.comments)).toBe(true);
    expect(discussion.comments[0].id).toMatch(/^comment_/);
    expect(discussion.comments[0].author).toBe('user_456');
    expect(discussion.createdAt).toBeInstanceOf(Date);
    expect(discussion.updatedAt).toBeInstanceOf(Date);
  });

  test('Discussion comment structure is correct', () => {
    const comment: DiscussionComment = {
      id: `comment_${randomUUID()}`,
      content: 'Sample comment content',
      author: 'user_789',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(comment.id).toMatch(/^comment_/);
    expect(comment.content).toBe('Sample comment content');
    expect(comment.author).toBe('user_789');
    expect(comment.createdAt).toBeInstanceOf(Date);
    expect(comment.updatedAt).toBeInstanceOf(Date);
  });

  test('Discussion can have empty comments array', () => {
    const discussion: Discussion = {
      id: `discussion_${randomUUID()}`,
      title: 'Discussion without comments',
      content: 'This discussion has no comments yet',
      author: 'user_123',
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(discussion.comments).toEqual([]);
    expect(discussion.comments.length).toBe(0);
  });

  test('Discussion ID and Comment ID format validation', () => {
    const discussionId = `discussion_${randomUUID()}`;
    const commentId = `comment_${randomUUID()}`;

    expect(discussionId).toMatch(/^discussion_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(commentId).toMatch(/^comment_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});