export default function useScroller() {
    window.onscroll = function () {
        scrollFunctionBTT(); // back to top button
    };
    /* Back To Top Button */
    // Get the button
    const myButton = document.getElementById("myBtn");

    // When the user scrolls down 20px from the top of the document, show the button
    function scrollFunctionBTT() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            myButton.style.display = "block";
        } else {
            myButton.style.display = "none";
        }
    }
    document.getElementById('myBtn').onclick = topFunction;
    function topFunction() {
        document.body.scrollTop = 0; // for Safari
        document.documentElement.scrollTop = 0; // for Chrome, Firefox, IE and Opera
    }
}
