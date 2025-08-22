self.onmessage = async (e) => {
  if (e.data === 'init') {
    try {
      const opfsRoot = await navigator.storage.getDirectory();
      const fileHandle = await opfsRoot.getFileHandle('notes.db', { create: true });
      const syncHandle = await fileHandle.createSyncAccessHandle();
      // In a real setup, you'd proxy file operations through this worker since syncHandle can't be passed directly
      // For simplicity, post back success; extend for full proxy if needed
      self.postMessage({ syncHandle }); // Note: syncHandle is not transferable; use MessageChannel or proxy methods
    } catch (error) {
      self.postMessage({ error });
    }
  }
};