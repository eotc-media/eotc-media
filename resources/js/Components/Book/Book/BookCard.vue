<script setup>
defineProps({
    book: Object
})
</script>


<template>
    <div class="card">
        <div class="card-body pe-1 py-1">
            <div class="row align-items-center">
                <div class="col-9">
                    <Link :href="route('book.books.view', book.slug)">
                    <h4>{{ book.name }}</h4>
                    </Link>
                    <p class="details font-italic mb-0">Upload date:
                        {{
                        new Date(book.created_at).toLocaleDateString("en-US", {
                            year: 'numeric', month:
                                'short', day: 'numeric'
                        })
                    }}
                    </p>
                    <p class="details font-italic mb-0">Category:
                        {{ book.categories.map((category) => category.name).join(', ') }}
                    </p>
                    <p class="details font-italic mb-0">Sub-category:
                        {{ book.sub_categories.map((sub_category) => sub_category.name).join(', ') }}
                    </p>
                </div>
                <div class="col-3 d-flex justify-content-end">
                    <img :src="'/storage/book/image/' + book.image" alt="">
                </div>
            </div>
        </div>
        <div class="card-footer pb-0">
            <div class="row">
                <div class="col-6 text-start">
                    <p>{{ book.likes_count }} likes | {{ book.comments_count }} comments</p>
                </div>
                <div class="col-6 text-end">
                    <a target="_blank" :href="'/storage/book/file/' + book.file">Download</a>
                    <Link class="ml-4" :href="route('book.books.view', book.slug)">Details</Link>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
h4 {
    font-size: 1.3rem;
    font-family: Verdana, Geneva, Tahoma, sans-serif;
}

img {
    height: 150px;
}

a h4 {
    color: black;
}

p.details {
    font-size: 0.8rem;
}
</style>