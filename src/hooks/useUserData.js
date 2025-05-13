import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const useUserData = (refreshKey = 0) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setUserData(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        // 👇 Initialize empty document for first-time users
        const emptyUser = {
          salary: 0,
          monthlyBudget: 0,
          categories: [],
          budgets: {},
          transactions: [],
          onboardingComplete: false
        };

        await setDoc(userRef, emptyUser);
        setUserData(emptyUser);
      }

      setLoading(false);
    };

    fetchUserData();
  }, [refreshKey]);

  return { userData, loading };
};
