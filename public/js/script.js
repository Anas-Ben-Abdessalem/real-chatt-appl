let container = document.getElementsByClassName("bubbles")
for (let i = 0;i<container.length;i++) {
    for (let v = 0;v<17;v++){
        container[i].innerHTML+=
         '<img src = "../media/index.png" style="--i:' +
          String(Math.floor(Math.random()*10)+ 10) +
         ';"></img>'
    }
}