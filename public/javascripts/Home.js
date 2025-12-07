
const postText = document.querySelectorAll('.postText')

for (p of postText){
    let post = p.innerText.replace(/<p><\/p>/g, '');
    p.innerHTML = post
}
