const miejsca_siedz = document.getElementById("siedzenia");
const lista_wyboru = document.getElementById("lista_wyboru");
const cal_elem_ceny = document.getElementById("cal_cena");
const przycisk_zamowienia = document.getElementById("przycisk_zamowienia");
const rezerwacja_zamowienia = document.getElementById("rezerwacja_zamowienia");
const ekran = document.getElementById("ekran");
const lista_ceny = document.getElementById("lista_ceny");
const instrukcja_wyboru = document.getElementById("instrukcja_wyboru");
const reservedSummaryDiv = document.getElementById("reserved_summary");
const currentReservationGroup = document.getElementById("current_reservation_group");
const currentReservedListDiv = document.getElementById("current_reserved_list");
const otherReservationsGroup = document.getElementById("other_reservations_group");
const otherReservedListDiv = document.getElementById("other_reserved_list");
const currentReservedTotalPriceDiv = document.getElementById("current_reserved_total_price");
const otherReservedTotalPriceDiv = document.getElementById("other_reserved_total_price");
const totalAllReservedPriceDiv = document.getElementById("total_all_reserved_price");
const reservedEditInstruction = document.getElementById("reserved_edit_instruction");
const messageArea = document.getElementById("message-area");
const popup = document.getElementById("ticket-type-popup");
const closeButton = popup.querySelector(".close-popup");
const typeOptions = popup.querySelectorAll(".ticket-type-option");
const selectionOptionsDiv = document.getElementById("selection-options");
const reservedOptionsDiv = document.getElementById("reserved-options");
const reservedSeatInfoP = document.getElementById("reserved-seat-info");
const unreserveButton = document.getElementById("unreserve-button");
let zaznaczone_miejsca = {};
let zarezerwowane_miejsca = JSON.parse(localStorage.getItem("zarezerwowane_miejsca") || "[]");
let lastConfirmedSeatIndices = [];
let biezace_wiersze = 0;
let biezace_kolumny = 0;
let rezerwacja_potwierdzona = false;
let brak_miejsc = false;
let currentSeatBeingInteracted = null;

function displayMessage(message, type = "info", duration = 5000) {
  messageArea.textContent = message;
  messageArea.className = "message-area " + type;
  messageArea.classList.remove("hidden");
  if (type !== "error" && duration > 0) {
    setTimeout(() => {
      messageArea.classList.add("hidden");
      setTimeout(() => {
        messageArea.textContent = "";
      }, 500);
    }, duration);
  }
}

function clearMessage() {
  messageArea.textContent = "";
  messageArea.className = "message-area";
  messageArea.classList.add("hidden");
}

function findReservedSeatByIndex(index) {
  return zarezerwowane_miejsca.find((seat) => seat.index === index);
}

function removeReservedSeatByIndex(index) {
  zarezerwowane_miejsca = zarezerwowane_miejsca.filter(
    (seat) => seat.index !== index
  );
}

function generuj_siedzenia(reset = false) {
  clearMessage();
  brak_miejsc = false;
  if (reset) {
    zarezerwowane_miejsca = [];
    localStorage.removeItem("zarezerwowane_miejsca");
    lastConfirmedSeatIndices = [];
    displayMessage(
      "Wygenerowano nową salę. Poprzednie rezerwacje zostały usunięte.",
      "info"
    );
  }
  biezace_wiersze = parseInt(document.getElementById("rzedy").value);
  biezace_kolumny = parseInt(document.getElementById("kolumny").value);
  if (
    isNaN(biezace_wiersze) ||
    isNaN(biezace_kolumny) ||
    biezace_wiersze <= 0 ||
    biezace_kolumny <= 0
  ) {
    displayMessage("Proszę podać prawidłowe liczby rzędów i miejsc.", "error");
    miejsca_siedz.innerHTML = "";
    ekran.style.display = "none";
    miejsca_siedz.style.display = "none";
    instrukcja_wyboru.style.display = "none";
    lista_wyboru.style.display = "none";
    cal_elem_ceny.style.display = "none";
    rezerwacja_zamowienia.style.display = "none";
    lista_ceny.style.display = "none";
    reservedSummaryDiv.style.display = "none";
    przycisk_zamowienia.style.display = "none";
    return;
  }
  if (!rezerwacja_potwierdzona || reset) {
    zaznaczone_miejsca = {};
    aktualizul_liste_zazn();
  }
  miejsca_siedz.innerHTML = "";
  miejsca_siedz.style.setProperty("--kolumny", biezace_kolumny);
  const totalSeats = biezace_wiersze * biezace_kolumny;
  for (let rzad = 0; rzad < biezace_wiersze; rzad++) {
    const rzadDiv = document.createElement("div");
    rzadDiv.classList.add("rzad");
    for (let kolumny = 0; kolumny < biezace_kolumny; kolumny++) {
      const index = rzad * biezace_kolumny + kolumny;
      const siedzenie = document.createElement("div");
      siedzenie.classList.add("siedzenie");
      siedzenie.dataset.index = index;
      siedzenie.innerHTML = `${rzad + 1}/${kolumny + 1}<br>🪑`;
      const reservedSeatData = findReservedSeatByIndex(index);
      const indexInt = parseInt(index);
      if (reservedSeatData) {
        siedzenie.classList.add("reserved");
        siedzenie.classList.add(`reserved-${reservedSeatData.type}`);
        const isRecentlyConfirmedAndEditable =
          rezerwacja_potwierdzona &&
          lastConfirmedSeatIndices.includes(indexInt);
        if (isRecentlyConfirmedAndEditable) {
          siedzenie.classList.add("editable");
          siedzenie.classList.remove("reserved-final");
          siedzenie.addEventListener("click", () =>
            handleReservedSeatClick(siedzenie, indexInt, reservedSeatData.type)
          );
        } else {
          siedzenie.classList.remove("editable");
          siedzenie.classList.add("reserved-final");
        }
      } else {
        if (!rezerwacja_potwierdzona) {
          siedzenie.addEventListener("click", () =>
            handleSeatClick(siedzenie, indexInt)
          );
        } else {
          siedzenie.style.cursor = "not-allowed";
        }
      }
      rzadDiv.appendChild(siedzenie);
    }
    miejsca_siedz.appendChild(rzadDiv);
  }
  if (zarezerwowane_miejsca.length === totalSeats && totalSeats > 0) {
    brak_miejsc = true;
    displayMessage(
      "Brak dostępnych miejsc. Możesz anulować istniejące rezerwacje.",
      "error"
    );
  } else {
    brak_miejsc = false;
    if (messageArea.textContent.includes("Brak dostępnych miejsc.")) {
      clearMessage();
    }
  }
  ekran.style.display = "inline-block";
  miejsca_siedz.style.display = "flex";
  przycisk_zamowienia.style.display =
    rezerwacja_potwierdzona && !brak_miejsc ? "inline-block" : "none";
  instrukcja_wyboru.style.display =
    !rezerwacja_potwierdzona && !brak_miejsc ? "block" : "none";
  lista_wyboru.style.display =
    !rezerwacja_potwierdzona && !brak_miejsc ? "block" : "none";
  cal_elem_ceny.style.display =
    !rezerwacja_potwierdzona && !brak_miejsc ? "block" : "none";
  rezerwacja_zamowienia.style.display =
    !rezerwacja_potwierdzona && !brak_miejsc ? "inline-block" : "none";
  lista_ceny.style.display =
    !rezerwacja_potwierdzona && !brak_miejsc ? "inline-block" : "none";
  if (zarezerwowane_miejsca.length > 0) {
    reservedSummaryDiv.style.display = "block";
    aktualizuj_liste_zarezerwowanych();
  } else {
    reservedSummaryDiv.style.display = "none";
    aktualizuj_liste_zarezerwowanych();
  }
  reservedEditInstruction.style.display =
    currentReservationGroup.style.display === "block" ? "block" : "none";
}

function handleSeatClick(siedzenie, index) {
  clearMessage();
  const isSelectedNormal = siedzenie.classList.contains("selected-normal");
  const isSelectedDiscounted = siedzenie.classList.contains(
    "selected-discounted"
  );
  if (isSelectedNormal || isSelectedDiscounted) {
    delete zaznaczone_miejsca[index];
    siedzenie.classList.remove("selected-normal", "selected-discounted");
    siedzenie.style.backgroundColor = "";
    aktualizul_liste_zazn();
  } else {
    currentSeatBeingInteracted = siedzenie;
    showPopup("selection");
  }
}

function handleReservedSeatClick(siedzenie, index, type) {
  clearMessage();
  if (rezerwacja_potwierdzona && lastConfirmedSeatIndices.includes(index)) {
    currentSeatBeingInteracted = siedzenie;
    const rzadNum = Math.floor(index / biezace_kolumny) + 1;
    const kolumnyNum = (index % biezace_kolumny) + 1;
    const typeLabel = type === "normal" ? "Normalny" : "Ulgowy";
    reservedSeatInfoP.innerHTML = `Rząd ${rzadNum}, Miejsce ${kolumnyNum} (${typeLabel})`;
    showPopup("reserved");
  }
}

function showPopup(mode) {
  clearMessage();
  selectionOptionsDiv.style.display = "none";
  reservedOptionsDiv.style.display = "none";
  if (mode === "selection") {
    selectionOptionsDiv.style.display = "block";
  } else if (mode === "reserved") {
    reservedOptionsDiv.style.display = "block";
  }
  popup.classList.add("active");
}

function hidePopup() {
  popup.classList.remove("active");
  currentSeatBeingInteracted = null;
}
function aktualizul_liste_zazn() {
  lista_wyboru.innerHTML = "<strong>Wybrane miejsca:</strong><br>";
  const entries = Object.entries(zaznaczone_miejsca);
  let total = 0;
  if (entries.length === 0) {
    lista_wyboru.innerHTML += "<em>Brak</em>";
    cal_elem_ceny.innerHTML = "";
    return;
  }
  entries.sort(([indexA], [indexB]) => parseInt(indexA) - parseInt(indexB));
  entries.forEach(([index, type]) => {
    const rzadNum = Math.floor(index / biezace_kolumny) + 1;
    const kolumnyNum = (index % biezace_kolumny) + 1;
    const typeLabel = type === "normal" ? "Normalny" : "Ulgowy";
    const price = type === "normal" ? 25 : 15;
    total += price;
    lista_wyboru.innerHTML += `<div>Rząd ${rzadNum}, Miejsce ${kolumnyNum} – ${typeLabel} (${price}zł)</div>`;
  });
  cal_elem_ceny.innerHTML = `<strong>Łączna cena: ${total} zł</strong>`;
}

function aktualizuj_liste_zarezerwowanych() {
  currentReservedListDiv.innerHTML = "";
  otherReservedListDiv.innerHTML = "";
  totalAllReservedPriceDiv.innerHTML = "";
  currentReservedTotalPriceDiv.innerHTML = "";
  otherReservedTotalPriceDiv.innerHTML = "";
  let totalAll = 0;
  let totalCurrent = 0;
  let totalOther = 0;
  let currentReservationCount = 0;
  if (zarezerwowane_miejsca.length === 0) {
    currentReservationGroup.style.display = "none";
    otherReservationsGroup.style.display = "none";
    totalAllReservedPriceDiv.style.display = "none";
    currentReservedTotalPriceDiv.style.display = "none";
    otherReservedTotalPriceDiv.style.display = "none";
    return;
  }
  zarezerwowane_miejsca.sort((a, b) => a.index - b.index);
  zarezerwowane_miejsca.forEach((seat) => {
    const rzadNum = Math.floor(seat.index / biezace_kolumny) + 1;
    const kolumnyNum = (seat.index % biezace_kolumny) + 1;
    const typeLabel = seat.type === "normal" ? "Normalny" : "Ulgowy";
    const price = seat.type === "normal" ? 25 : 15;
    totalAll += price;
    const listItemHTML = `<div>Rząd ${rzadNum}, Miejsce ${kolumnyNum} – ${typeLabel} (${price}zł)</div>`;
    if (lastConfirmedSeatIndices.includes(seat.index)) {
      currentReservedListDiv.innerHTML += listItemHTML;
      totalCurrent += price;
      currentReservationCount++;
    } else {
      otherReservedListDiv.innerHTML += listItemHTML;
      totalOther += price;
    }
  });
  currentReservedTotalPriceDiv.innerHTML = `<strong>Cena: ${totalCurrent} zł</strong>`;
  otherReservedTotalPriceDiv.innerHTML = `<strong>Cena: ${totalOther} zł</strong>`;
  totalAllReservedPriceDiv.innerHTML = `<strong>Łączna cena rezerwacji (wszystkie miejsca): ${totalAll} zł</strong>`;
  currentReservationGroup.style.display =
    currentReservationCount > 0 ? "block" : "none";
  otherReservationsGroup.style.display =
    zarezerwowane_miejsca.length - currentReservationCount > 0
      ? "block"
      : "none";
  currentReservedTotalPriceDiv.style.display =
    currentReservationCount > 0 ? "block" : "none";
  otherReservedTotalPriceDiv.style.display =
    zarezerwowane_miejsca.length - currentReservationCount > 0
      ? "block"
      : "none";
  totalAllReservedPriceDiv.style.display = "block";
}

function potwierdz_rezerwacje() {
  clearMessage();
  const zaznaczoneEntries = Object.entries(zaznaczone_miejsca);
  if (zaznaczoneEntries.length === 0) {
    displayMessage("Proszę wybrać miejsca do rezerwacji.", "error");
    return;
  }
  const newlyReservedSeats = [];
  lastConfirmedSeatIndices = [];
  let konflikt = false;
  for (const [index, type] of zaznaczoneEntries) {
    const indexInt = parseInt(index);
    if (findReservedSeatByIndex(indexInt)) {
      konflikt = true;
    } else {
      newlyReservedSeats.push({ index: indexInt, type: type });
      lastConfirmedSeatIndices.push(indexInt);
    }
  }
  if (konflikt) {
    displayMessage(
      "Jedno lub więcej wybranych miejsc zostało w międzyczasie zarezerwowane. Proszę odświeżyć salę.",
      "error"
    );
    generuj_siedzenia();
    return;
  }
  zarezerwowane_miejsca = zarezerwowane_miejsca.concat(newlyReservedSeats);
  localStorage.setItem(
    "zarezerwowane_miejsca",
    JSON.stringify(zarezerwowane_miejsca)
  );
  rezerwacja_potwierdzona = true;
  if (newlyReservedSeats.length > 0) {
    displayMessage(
      `Dziękujemy za rezerwację! Zarezerwowano ${newlyReservedSeats.length} miejsce(a). Podsumowanie rezerwacji poniżej. Możesz anulować miejsca Z TEJ rezerwacji, klikając na nie.`,
      "success"
    );
  } else {
    displayMessage("Brak nowych miejsc do zarezerwowania.", "info");
  }
  zaznaczone_miejsca = {};
  aktualizul_liste_zazn();
  generuj_siedzenia();
}

function rozp_nowe_zamowienie() {
  clearMessage();
  const totalSeats = biezace_wiersze * biezace_kolumny;
  if (zarezerwowane_miejsca.length === totalSeats && totalSeats > 0) {
    displayMessage(
      "Sala jest pełna. Nie można złożyć nowego zamówienia, dopóki miejsca nie zostaną anulowane.",
      "error"
    );
    rezerwacja_potwierdzona = true;
    lastConfirmedSeatIndices = [];
    generuj_siedzenia();
    return;
  }
  lastConfirmedSeatIndices = [];
  rezerwacja_potwierdzona = false;
  zaznaczone_miejsca = {};
  aktualizul_liste_zazn();
  generuj_siedzenia();
  displayMessage("Rozpoczęto nowe zamówienie. Proszę wybrać miejsca.", "info");
}

typeOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const selectedType = option.getAttribute("data-type");
    const seatIndex = parseInt(currentSeatBeingInteracted.dataset.index);
    if (currentSeatBeingInteracted) {
      currentSeatBeingInteracted.classList.remove(
        "selected-normal",
        "selected-discounted"
      );
      currentSeatBeingInteracted.classList.add(`selected-${selectedType}`);
      zaznaczone_miejsca[seatIndex] = selectedType;
      aktualizul_liste_zazn();
    }
    hidePopup();
  });
});

unreserveButton.addEventListener("click", () => {
  clearMessage();
  if (currentSeatBeingInteracted) {
    const seatIndex = parseInt(currentSeatBeingInteracted.dataset.index);
    removeReservedSeatByIndex(seatIndex);
    localStorage.setItem(
      "zarezerwowane_miejsca",
      JSON.stringify(zarezerwowane_miejsca)
    );
    const lastIndex = lastConfirmedSeatIndices.indexOf(seatIndex);
    if (lastIndex > -1) {
      lastConfirmedSeatIndices.splice(lastIndex, 1);
    }
    hidePopup();
    generuj_siedzenia();
    const rzadNum = Math.floor(seatIndex / biezace_kolumny) + 1;
    const kolumnyNum = (seatIndex % biezace_kolumny) + 1;
    displayMessage(
      `Rezerwacja miejsca ${rzadNum}/${kolumnyNum} została anulowana.`,
      "info"
    );
    const totalSeats = biezace_wiersze * biezace_kolumny;
    if (zarezerwowane_miejsca.length < totalSeats) {
      if (messageArea.textContent.includes("Brak dostępnych miejsc.")) {
        clearMessage();
      }
    }
  }
});

closeButton.addEventListener("click", () => {
  hidePopup();
});

popup.addEventListener("click", (event) => {
  if (event.target === popup) {
    hidePopup();
  }
});

window.onload = () => {
  generuj_siedzenia();
};
