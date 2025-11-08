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

  // Stato per mostrare/nascondere la card
  const [isOpen, setIsOpen] = useState(false);

  const handleAddCategory = async () => {
    if (!newCategory.trim() || !user) return;

    await addDoc(collection(db, "categories"), {
      nome: newCategory.trim(),
      tipo: newCategoryType,
      uid: user.uid,
    });

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
    try {
      await deleteDoc(doc(db, "categories", id));
    } catch (error) {
      console.error("Errore eliminazione categoria:", error);
      alert("Errore durante l'eliminazione. Riprova.");
    }
  };

  return (
    <div className="card p-3 mb-4">
      {/* HEADER DELLA CARD */}
      <div className="d-flex justify-content-between align-items-center">
        <h4
          className="fw-semibold mb-3 mb-md-0"
          style={{ cursor: "pointer" }}
          onClick={() => setIsOpen(!isOpen)} // clic sul titolo per aprire/chiudere
        >
          🖇️​ Categorie Personalizzate
        </h4>

        {/* Pulsante con icona Font Awesome */}
        <button className="btn btn-primary" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? (
            <i className="fa-solid fa-minus"></i>
          ) : (
            <i className="fa-solid fa-plus"></i>
          )}
        </button>
      </div>

      {/* CONTENUTO VISIBILE SOLO QUANDO LA CARD È APERTA */}
      {isOpen && (
        <>
          {/* Form responsive */}
          <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-2 mb-3 mt-3">
            <input
              type="text"
              placeholder="Nuova categoria..."
              className="form-control flex-grow-1"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <select
              className="form-select flex-grow-1 flex-md-grow-0 w-100 w-md-auto"
              value={newCategoryType}
              onChange={(e) => setNewCategoryType(e.target.value)}
            >
              <option value="entrata">Entrata</option>
              <option value="uscita">Uscita</option>
              <option value="risparmio">Risparmio</option>
            </select>
            <button
              className="btn btn-primary w-100 w-md-auto"
              onClick={handleAddCategory}
            >
              Aggiungi
            </button>
          </div>

          {/* Lista categorie */}
          <ul className="list-group">
            {customCategories.map((c) => (
              <li
                key={c.id}
                className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2"
              >
                <div className="d-flex flex-column flex-md-row gap-2 flex-grow-1">
                  <input
                    type="text"
                    className="form-control"
                    defaultValue={c.nome}
                    onBlur={(e) =>
                      handleEditCategory(c.id, e.target.value, c.tipo)
                    }
                  />
                  <select
                    className="form-select"
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
                  className="btn btn-sm btn-outline-danger align-self-md-center"
                  onClick={() => handleDeleteCategory(c.id)}
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
