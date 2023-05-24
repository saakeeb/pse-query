const resultCardTemplate = document.querySelector("#result-card-template");
const overlayElement = document.querySelector("#view-overlay");
const closeOverlayBtn = document.querySelector("#view-overlay-close");
const overlayIframeElm = document.querySelector("#view-overlay-src");
const overlayIframeDesc = document.querySelector("#view-overlay-desc");
const overlayVisitBtn = document.querySelector("#view-overlay-visit");

let currentResults = [];
let activeEmbededLink = "";

// function returns the formatted string representing the truncated view count
const truncateViewCount = (count) => {
  let multiplyCount = 0;
  const multiplyMap = {
    1: "k",
    2: "m",
    3: "b",
  };
  while (count > 1000) {
    multiplyCount++;
    count = count / 1000;
  }

  return `${Math.round(count)}${multiplyMap[multiplyCount] ?? ""}`;
};

// creates a result card element, populates it with data from the data object,
const buildResultCard = (data, index) => {
  const hasVideoObject = data.richSnippet.videoobject;
  const hasPerson = data.richSnippet.person;
  const resultCard = resultCardTemplate.content.cloneNode(true);
  const elm = resultCard.querySelector("#result-card");
  const thumbnail = resultCard.querySelector("#result-card-thumbnail");
  const title = resultCard.querySelector("#result-card-title");
  const person = resultCard.querySelector("#result-card-by");
  const viewCount = resultCard.querySelector("#result-card-view-count");

  elm.setAttribute("data-index", index);
  thumbnail.src = data.thumbnailImage.url;
  title.innerHTML = data.title;

  if (hasPerson) {
    person.innerText = data.richSnippet.person.name;
  }

  let rawViewCount = data.richSnippet.videoobject.interactioncount;

  if (hasVideoObject) {
    viewCount.innerText = truncateViewCount(Number(rawViewCount)) + " views";
  }

  elm.addEventListener("click", function (e) {
    setTimeout(() => {
      overlayElement.style.display = "flex";
      const dataIdx = e.target.offsetParent.getAttribute("data-index");
      const curr = currentResults[dataIdx];

      if (curr.richSnippet.videoobject) {
        overlayIframeElm.src = curr.richSnippet.videoobject.embedurl;
        overlayIframeDesc.querySelector("p.title").innerHTML = data.title;
        overlayIframeDesc.querySelector("p.views").innerHTML =
          truncateViewCount(Number(rawViewCount)) + " views";
        activeEmbededLink = curr.richSnippet.videoobject.url;
      }
    }, 400);
  });

  return resultCard;
};

// sorts the search results based on the interaction count
const onSearchResultReadyCallback = (name, q, promos, results) => {
  currentResults = results.sort((first, second) => {
    const firstVideoObj = first.richSnippet.videoobject;
    const secondVideoObj = second.richSnippet.videoobject;

    let firstCompareValue = 0;
    let secondCompareValue = 0;

    if (firstVideoObj)
      firstCompareValue = Number(firstVideoObj.interactioncount);
    if (secondVideoObj)
      secondCompareValue = Number(secondVideoObj.interactioncount);

    return secondCompareValue - firstCompareValue;
  });
};

// loops over search results and append the respective cards
const onResultRenderedCallback = (name, q, promos, results) => {
  let index = 0;
  for (const resultElm of results) {
    resultElm.innerHTML = "";
    const data = currentResults[index];
    const videoObject = data.richSnippet.videoobject;

    if (!videoObject || (videoObject.genre && videoObject.genre != "Music")) {
      index++;
      continue;
    }

    const resultCard = buildResultCard(data, index);

    resultElm.appendChild(resultCard);
    index++;
  }
};

const onStartSearchCallback = (gname, query) => query;

const onOverlayClose = () => (overlayElement.style.display = "none");

const onOverlayVisit = () => {
  overlayElement.style.display = "none";
  overlayVisitBtn.parentElement.href = activeEmbededLink;
};

closeOverlayBtn.addEventListener("click", onOverlayClose);
overlayVisitBtn.addEventListener("click", onOverlayVisit);

// defining custom behavior for different stages of the search process
window.addEventListener("DOMContentLoaded", () => {
  window.__gcse || (window.__gcse = {});
  window.__gcse.searchCallbacks = {
    web: {
      starting: onStartSearchCallback,
      ready: onSearchResultReadyCallback,
      rendered: onResultRenderedCallback,
    },
  };
});
