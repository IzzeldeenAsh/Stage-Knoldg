// Fix for ngx-quill parchment Registry type error
declare module 'parchment' {
  export interface Registry {
    // Add any missing properties if needed
  }
}

// Alternative namespace declaration
declare namespace parchment {
  export interface Registry {
    // Registry interface for ngx-quill compatibility
  }
}
