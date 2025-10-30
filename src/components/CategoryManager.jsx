import React, { useState } from "react";
import { db } from "../firebaseConfig";
import {
  addDoc,
  collection,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function CategoryManager({
  user,
  customCategories,
  setCustomCategories,
}) {
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryType, setNewCategoryType] = useState("entrata");

  const handleAddCategory = async () => {
    if (!newCategory.trim() || !user) return;
    const docRef = await addDoc(collection(db, "categories"), {
      nome: newCategory.trim(),
      tipo: newCategoryType,
      uid: user.uid,
    });
    setCustomCategories((prev) => [
      ...prev,
      { id: docRef.id, nome: newCategory.trim(), tipo: newCategoryType },
    ]);
    setNewCategory("");
  };

  const handleEditCategory = async (id, nome, tipo) => {
    await updateDoc(doc(db, "categories", id), { nome, tipo });
    setCustomCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, nome, tipo } : c))
    );
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Vuoi davvero eliminare questa categoria?")) return;
    await deleteDoc(doc(db, "categories", id));
    setCustomCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="card p-3 mb-4">
      <h5>Categorie Personalizzate</h5>
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        <input
          type="text"
          placeholder="Nuova categoria..."
          className="form-control w-auto"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <select
          className="form-select w-auto"
          value={newCategoryType}
          onChange={(e) => setNewCategoryType(e.target.value)}
        >
          <option value="entrata">Entrata</option>
          <option value="uscita">Uscita</option>
          <option value="risparmio">Risparmio</option>
        </select>
        <button className="btn btn-outline-primary" onClick={handleAddCategory}>
          ➕ Aggiungi
        </button>
      </div>

      <ul className="list-group">
        {customCategories.map((c) => (
          <li
            key={c.id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div className="d-flex gap-2 align-items-center">
              <input
                type="text"
                className="form-control w-auto border-0"
                defaultValue={c.nome}
                onBlur={(e) => handleEditCategory(c.id, e.target.value, c.tipo)}
              />
              <select
                className="form-select w-auto"
                defaultValue={c.tipo}
                onChange={(e) =>
                  handleEditCategory(c.id, c.nome, e.target.value)
                }
              >
                <option value="entrata">Entrata</option>
                <option value="uscita">Uscita</option>
                <option value="risparmio">Risparmio</option>
              </select>
            </div>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDeleteCategory(c.id)}
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
