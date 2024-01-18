$(document).ready(() => {
    $('#hamburger-menu').click(() => {
        $('#hamburger-menu').toggleClass('active')
        $('#nav-menu').toggleClass('active')
    })

    // setting owl carousel

    let navText = ["<i class='bx bx-chevron-right'></i>", "<i class='bx bx-chevron-left'></i>"]

    $('#hero-carousel').owlCarousel({
        items: 1,
        dots: true,
        loop: true,
        rtl: true,
        nav:true,
        navText: navText,
        autoplay: false,
        autoplayHoverPause: true
    })
    $('.movies-slide').owlCarousel({
        items: 2,
        dots: true,
        nav:true,
        rtl: true,
        navText: navText,
        margin: 15,
        responsive: {
            500: {
                items: 3
            },
            1280: {
                items: 6
            },
            1600: {
                items: 6
            }
        }
    })
})