import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRoleType } from '../types';
import { auth, db, ensureAuthenticated } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserRoleContextType {
  role: UserRoleType;
  displayName: string;
  isConfigured: boolean;
  isPickerOpen: boolean;
  currentUserId: string | null;
  setRole: (role: UserRoleType, customName?: string) => Promise<void>;
  openRolePicker: () => void;
  closeRolePicker: () => void;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

const STORAGE_ROLE_KEY = 'sonne_mond_user_role';
const STORAGE_NAME_KEY = 'sonne_mond_user_name';

export const UserRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRoleType>(() => {
    const saved = localStorage.getItem(STORAGE_ROLE_KEY);
    return (saved === 'mond' || saved === 'sonne') ? saved : 'sonne';
  });

  const [displayName, setDisplayName] = useState<string>(() => {
    const savedName = localStorage.getItem(STORAGE_NAME_KEY);
    if (savedName) {
      const sanitized = savedName.replace(/\s*\((Stefanie|Manuel)\)/gi, '').trim();
      return sanitized || (localStorage.getItem(STORAGE_ROLE_KEY) === 'mond' ? 'Der Mond' : 'Die Sonne');
    }
    const savedRole = localStorage.getItem(STORAGE_ROLE_KEY);
    return savedRole === 'mond' ? 'Der Mond' : 'Die Sonne';
  });

  const [isConfigured, setIsConfigured] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_ROLE_KEY) !== null;
  });

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Initialize Auth & Firestore sync
  useEffect(() => {
    ensureAuthenticated().then((user) => {
      if (!user) return;
      setCurrentUserId(user.uid);

      // Check if role is stored in cloud
      const roleDocRef = doc(db, 'user_roles', user.uid);
      getDoc(roleDocRef).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.role === 'sonne' || data.role === 'mond') {
            setRoleState(data.role);
            const rawName = data.displayName || '';
            const sanitized = rawName.replace(/\s*\((Stefanie|Manuel)\)/gi, '').trim() || (data.role === 'mond' ? 'Der Mond' : 'Die Sonne');
            setDisplayName(sanitized);
            setIsConfigured(true);
            localStorage.setItem(STORAGE_ROLE_KEY, data.role);
            localStorage.setItem(STORAGE_NAME_KEY, sanitized);
          }
        }
      }).catch((err) => {
        console.warn('Could not read user role from cloud:', err);
      });
    }).catch(console.error);
  }, []);

  const setRole = async (newRole: UserRoleType, customName?: string) => {
    const rawInput = customName || '';
    const sanitizedInput = rawInput.replace(/\s*\((Stefanie|Manuel)\)/gi, '').trim();
    const nameToUse = sanitizedInput || (newRole === 'sonne' ? 'Die Sonne' : 'Der Mond');
    
    setRoleState(newRole);
    setDisplayName(nameToUse);
    setIsConfigured(true);
    localStorage.setItem(STORAGE_ROLE_KEY, newRole);
    localStorage.setItem(STORAGE_NAME_KEY, nameToUse);

    try {
      const user = await ensureAuthenticated();
      if (user) {
        await setDoc(doc(db, 'user_roles', user.uid), {
          userId: user.uid,
          role: newRole,
          displayName: nameToUse,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Could not sync user role to cloud:', err);
    }
  };

  const openRolePicker = () => setIsPickerOpen(true);
  const closeRolePicker = () => setIsPickerOpen(false);

  return (
    <UserRoleContext.Provider
      value={{
        role,
        displayName,
        isConfigured,
        isPickerOpen,
        currentUserId,
        setRole,
        openRolePicker,
        closeRolePicker,
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = (): UserRoleContextType => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};
