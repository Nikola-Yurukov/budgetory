import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const useUserData = (refreshKey = 0) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setUserData(null); // Or handle onboarding
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    // Ensure auth is ready
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchUserData();
      else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [refreshKey]);

  return { userData, loading };
};
