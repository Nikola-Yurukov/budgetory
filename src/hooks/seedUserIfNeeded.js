// src/utils/seedUserIfNeeded.js
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const seedUserIfNeeded = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
     budgets: userData?.budgets || {},
      categories: ["Храна", "Наем", "Забавление", "Спорт"],
      transactions: []
    });
  }
};
