<script setup>

</script>

<template>
    <div class="copyright">
        <div class="container text-center">
            Copyright &copy; {{ new Date().getFullYear() }} <a href="https://eotcmedia.com">EOTC
                Media</a>.
            All
            rights reserved.
        </div>
    </div>
</template>

<style scoped>
.copyright {
    padding-top: 1.5rem;
    border-top: 1px solid #cccccc;
    text-align: center;
}

.copyright a {
    text-decoration: none;
}

.copyright .list-unstyled,
.copyright .statement {
    opacity: 0.7;
}

/* Min-width 992px */
@media (min-width: 992px) {


    /* Copyright */
    .copyright {
        text-align: left;
    }

    .copyright .statement {
        text-align: right;
    }

    /* end of copyright */
}
</style>