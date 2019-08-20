function MyPromise(excutor) {
  const self = this

  self.status = 'pending'
  self.data = undefined
  self.onResolvedCallbacks = []
  self.onRejectedCallbacks = []

  function resolve(value) {
    if (self.status === 'pending') {
      self.status = 'fulfilled'
      self.data = value
      self.onResolvedCallbacks.forEach(cb => cb(value))
    }
  }

  function reject(error) {
    if (self.status === 'pending') {
      self.status = 'rejected'
      self.data = error
      self.onRejectedCallbacks.forEach(cb => cb(error))
    }
  }

  try {
    excutor(resolve, reject)
  } catch (error) {
    reject(error)
  }
}

MyPromise.prototype.then = function promiseThen(onResolve, onReject) {
  let self = this
  onResolve = typeof onResolve === 'function' ? onResolve : function defaultResolve(value) { return value }
  onReject = typeof onReject === 'function' ? onReject : function defaultReject(reason) { throw reason }

  if (self.status === 'pending') {
    return new MyPromise(function (resolve, reject) {
      self.onResolvedCallbacks.push(function (value) {
        try {
          const x = onResolve(value)
          if (x instanceof MyPromise) {
            x.then(resolve, reject)
          } else {
            resolve(x)
          }
        } catch (error) {
          reject(error)
        }
      })

      self.onRejectedCallbacks.push(function (reason) {
        try {
          const x = onReject(reason)
          if (x instanceof MyPromise) {
            x.then(resolve, reject)
          } else {
            resolve(x)
          }
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  if (self.status === 'fulfilled') {
    return new MyPromise(function (resolve, reject) {
      try {
        const x = onResolve(self.data)
        if (x instanceof MyPromise) {
          x.then(resolve, reject)
        } else {
          resolve(x)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  if (self.status === 'rejected') {
    return new MyPromise(function (resolve, reject) {
      try {
        const x = onReject(self.data)
        if (x instanceof MyPromise) {
          x.then(resolve, reject)
        } else {
          resolve(x)
        }
      } catch (error) {
        reject(error)
      }
    })
  }
}

MyPromise.prototype.catch = function promiseCatch(onRejected) {
  return this.then(null, onRejected)
}

function resolvePromise(promise, x, resolve, reject) {
  let then
  let thenCalledOrThrow = false

  if (promise === x) {
    return reject(new TypeError('Chaining cycle detected for promise!'))
  }

  if (x instanceof MyPromise) {
    if (x.status === 'pending') {
      x.then(value => {
        resolvePromise(promise, value, resolve, reject)
      }, err => {
        reject(err)
      })
    } else {
      x.then(resolve, reject)
    }
    return
  }

  if ((x !== null && typeof x === 'function') || typeof x === 'object') {
    try {
      then = x.then
      if (typeof then === 'function') {
        then.call(x, value => {
          if (thenCalledOrThrow) return
          thenCalledOrThrow = true
          resolvePromise(promise, value, resolve, reject)
        }, err => {
          if (thenCalledOrThrow) return
          thenCalledOrThrow = true
          reject(err)
        })
      } else {
        resolve(x)
      }
    } catch (error) {
      reject(error)
      return
    }
  } else {
    resolve(x)
  }
}
