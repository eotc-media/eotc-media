<script setup>
</script>
<script>
import GuestLayout from '@/Layouts/Main/GuestLayout.vue'
export default {
    layout: GuestLayout
}
</script>

<template>

    <Head title="Home" />

    <div class="container">
        <div class="row d-flex align-items-center">
            <div class="col-md-10 offset-md-1">
                <div class="text-center my-3">
                    <img class="w-100" src="/image/main/header.jpg" alt="">
                </div>
                <div class="my-2">
                    <div class="d-none d-md-block">
                        <h3>የኢትዮጵያ ኦርቶዶክስ ተዋህዶ ቤተክርስቲያን የሚዲያ ውጤቶች</h3>
                        <h4>Ethiopian Orthodox Tewahedo (EOTC) Chruch Media Resources</h4>
                    </div>
                    <div class="d-md-none">
                        <h4>የኢትዮጵያ ኦርቶዶክስ ተዋህዶ ቤተክርስቲያን የሚዲያ ውጤቶች</h4>
                        <h5>Ethiopian Orthodox Tewahedo (EOTC) Chruch Media Resources</h5>
                    </div>
                    <hr>
                    <p>በዚህ ድረ ገጽ የኢትዮጵያ ኦርቶዶክስ ተዋህዶ ቤተክርስቲያን የሚዲያ ውጤቶችን መጽሃፍ ቅዱስን ጨምሮ የተለያዩ መጻህፍትን፣ መዝሙራት፣ ስብከቶች እና
                        ሌሎችንም ያገኛሉ። በተጨማሪም
                        <Link href="/login">አካውንት በመክፈት</Link> እርስዎ ያለዎትን መንፈሳዊ ስራዎች ለሌሎች ማጋራት ይችላሉ።
                        አስተያየት ካለዎት፣
                        <Link :href="route('feedbacks.create')">ይህን አገናኝ</Link> በመጠቀም ለኛ ማጋራት ይችላሉ።
                    </p>
                    <p>On this website, media resources of the Ethiopian Orthodox Tewahedo (EOTC) Church, various
                        books
                        (including the Bible), hymns, sermons, and more are provided. You can also
                        <Link href="/login">open an account</Link> and share your spiritual resources with others. If
                        you have any feedback, please use
                        <Link :href="route('feedbacks.create')">this link</Link> to share it with us.
                    </p>
                </div>
                <hr>
                <div class="border rounded p-3 my-3">
                    <Link :href="route('bible.show_chapter', ['amharic', '1954', 1, 1])">
                    <h5>መጽሃፍ ቅዱስ / Bible</h5>
                    </Link>
                    <p>መጽሃፍ ቅዱስ በተለያዩ ቋንቋዎች: አማርኛ፣ እንግሊዝኛ፣ ኦሮምኛ፣ ትግርኛ፣ እና ሌሎችም / The Bible in different languages:
                        Amharic, English, Afaan Oromo, Tigrigna, and more</p>
                </div>
                <div class="border rounded p-3 my-3">
                    <Link :href="route('book.books.index', [0, 0, 0])">
                    <h5>መጻህፍት / Books</h5>
                    </Link>
                    <p>በቀደሙ የቤተክርስትያን አባቶችና በአሁኑ ዘመን የተጻፉ የቤተ ክርስቲያን መጻህፍት / Books by early Church fathers and
                        contemporary Church teachers, with differnt categories</p>
                </div>
                <div class="border rounded p-3 my-3">
                    <Link :href="route('hymn.hymns.index', [0, 0, 0])">
                    <h5>መዝሙራት / Hymns</h5>
                    </Link>
                    <p>የሚፈልጉትን መዝሙር በቀላሉ ለማግኘት በሚያስችል መንገድ የቀረቡ መንፈሳዊ መዝሙራት / Spiritual hymns organized for easy
                        access
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
a:hover .card {
    background-color: #ddf0fe;
}

h4 {
    font-size: 1.5rem;
    font-weight: 400;
}

hr {
    border-color: #888888;
}
</style>
