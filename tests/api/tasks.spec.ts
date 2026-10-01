import { randomUUID } from 'node:crypto';
import { test, expect } from '@playwright/test';

test('retrieves, creates, updates, and deletes a task', async ({ request }) => {
  const listResponse = await request.get('/tasks');
  expect(listResponse.status()).toBe(200);
  expect(Array.isArray(await listResponse.json())).toBe(true);

  const text = `QA task ${randomUUID()}`;
  const updatedText = `${text} updated`;
  let taskId: string | undefined;

  try {
    const createResponse = await request.post('/tasks', {
      data: { text },
    });
    const createdTask = await createResponse.json();

    // Capture the ID before assertions so failures can still trigger cleanup.
    if (typeof createdTask.id === 'string' && createdTask.id.length > 0) {
      taskId = createdTask.id;
    }

    expect(createResponse.status()).toBe(200);
    expect(createdTask).toEqual({
      id: expect.any(String),
      text,
      completed: false,
      createdDate: expect.any(Number),
    });
    expect(taskId).toBeTruthy();
    expect(createdTask.createdDate).toBeGreaterThan(0);

    // The official backend updates task text with POST, rather than PUT.
    const updateResponse = await request.post(`/tasks/${taskId}`, {
      data: { text: updatedText },
    });
    expect(updateResponse.status()).toBe(200);
    const updatedTask = await updateResponse.json();
    expect(updatedTask).toEqual({ ...createdTask, text: updatedText });

    const updatedListResponse = await request.get('/tasks');
    expect(updatedListResponse.status()).toBe(200);
    expect(await updatedListResponse.json()).toEqual(
      expect.arrayContaining([updatedTask]),
    );

    const deleteResponse = await request.delete(`/tasks/${taskId}`);
    expect(deleteResponse.status()).toBe(200);
    expect(await deleteResponse.text()).toBe('');

    const finalListResponse = await request.get('/tasks');
    expect(finalListResponse.status()).toBe(200);
    const finalTasks = await finalListResponse.json();
    expect(Array.isArray(finalTasks)).toBe(true);
    expect(finalTasks).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: taskId })]),
    );
    taskId = undefined;
  } finally {
    if (taskId) {
      const cleanupResponse = await request.delete(`/tasks/${taskId}`);
      // A previous delete may have succeeded before a later assertion failed.
      expect([200, 404]).toContain(cleanupResponse.status());
    }
  }
});
