export function tabFunction(tabButton, tabName) {
  //tabButton parameter is to get the id of the TAB BUTTON for the purpose of adding an active class on click
  //tabName parameter is to get the id of the TAB CONTENT div for the purpose of changing display style to block
    var tabcontent = document.getElementsByClassName("tabcontent");
    for (var i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
    var tablinks = document.getElementsByClassName("tablinks");
    for (var i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabButton).className += " active";
};
