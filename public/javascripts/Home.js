const postText = document.querySelectorAll(".postText");

for (let postElement of postText) {
  let post = postElement.innerText.replace(/<p><\/p>/g, "");
  postElement.innerHTML = post;
}
