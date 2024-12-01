import { InjectionToken } from '@angular/core';

export const localStorageToken = new InjectionToken<Storage>('localStorage', {
  providedIn: 'root',
  factory: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    } else {
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null,
      }; 
    }
  }
});
