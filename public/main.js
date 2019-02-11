document.addEventListener('DOMContentLoaded', function() {
    var dropDown = document.querySelector("dropdown");
    if(dropDown){

        dropDown.onchange = function(event) {
            if(event.target.value !== "0"){
                console.log(event.target.value);
                document.location = event.target.value;
            }
        }
    }
})

function createDropdown() {
    document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {

    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}