function Promise (excutor) {
  const self = this

  self.status = 'pending'
  self.data = undefined
  self.onResolveCallback = []
  self.onRejectCallback = []

  function resolve (value) {
    if (self.status === 'pending') {
      self.status = 'fulfilled'
      self.data = value
      self.onResolveCallback.forEach(cb => cb(value))
    }
  }

  function reject (error) {
    if (self.status === 'pending') {
      self.status = 'rejected'
      self.data = value
      self.onRejectCallback.forEach(cb => cb(value))
    }
  }

  try {
    excutor(resolve, reject)
  } catch (error) {
    reject(error)
  }
}