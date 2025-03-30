<script setup>
import { useForm } from '@inertiajs/vue3'
const props = defineProps({
    book: Object,
    likes_count: Number,
    has_liked: Boolean,
    has_disliked: Boolean,
    has_copyright_report: Boolean,
    copyright_reports_count: Number
})
const likeForm = useForm({})
const dislikeForm = useForm({})
const copyrightForm = useForm({
    description: ''
})
const commentForm = useForm({
    body: ''
})
const replyForm = useForm({
    body: ''
})
const removeCopyrightForm = useForm({})
const submitLike = () => {
    likeForm.post(route('book.user.books.like', props.book), {
        onFinish: () => {
            likeForm.reset()
        },
        preserveScroll: true
    })
}
const submitDislike = () => {
    dislikeForm.post(route('book.user.books.dislike', props.book), {
        onFinish: () => {
            dislikeForm.reset()
        },
        preserveScroll: true
    })
}
const submitCopyrightReport = () => {
    document.getElementById('close').click()
    copyrightForm.post(route('book.user.books.report_copyright', props.book), {
        preserveScroll: true
    })
    copyrightForm.reset()
}
const submitRemoveCopyright = () => {
    document.getElementById('close').click()
    removeCopyrightForm.post(route('book.user.books.remove_copyright', props.book), {
        preserveScroll: true
    })
}
const submitComment = () => {
    commentForm.post(route('book.user.books.comments.store', props.book), {
        preserveScroll: true
    })
    commentForm.reset()
}
const submitReply = (id) => {
    document.getElementById('close-reply').click()
    replyForm.post(route('book.user.books.comments.reply', { 'book': props.book.id, 'comment': id }), {
        preserveScroll: true
    })
    replyForm.reset()
}
</script>

<script>
import UserLayout from '@/Layouts/Book/UserLayout.vue';
export default {
    layout: UserLayout
}
</script>

<template>

    <Head title="Show" />

    <div class="py-3">
        <div class="card mt-5 p-md-5">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-3">
                        <div class="bg-image">
                            <img class="w-100" :src="'/storage/book/image/' + book.image" alt="">
                            <div class="mask" style="background-color: rgba(194, 194, 194, 0.275)"></div>
                        </div>
                    </div>
                    <div class="col-md-9">
                        <div class="my-2">
                            <h1 class="text-black">Book title: {{ book.name }}</h1>
                            <hr>
                            <div>By: <template v-for="author in book.authors" :key="author.id">
                                    <Link class="me-2" :href="route('book.books.author_books', author.slug)">{{
                                author.name
                            }}</Link>
                                </template></div>
                            <div class="fst-italic fw-light pt-2" style="color: darkgray">
                                Language: {{ book.languages.map((language) => language.name).join(', ') }}
                            </div>
                            <div class="fst-italic fw-light" style="color: darkgray">
                                Category: {{ book.categories.map((category) => category.name).join(', ') }}
                            </div>
                            <div class="fst-italic fw-light" style="color: darkgray">Sub category:
                                {{ book.sub_categories.map((sub_category) => sub_category.name).join(', ') }}</div>
                            <div class="fst-italic fw-light" style="color: darkgray">Uploaded by: {{ book.user.name }}
                            </div>
                            <div class="fst-italic fw-light pb-2" style="color: darkgray">
                                Upload date: {{ new Date(book.created_at) }}
                            </div>
                            <div v-if="book.description">
                                <h6>Description</h6>
                                <p>{{ book.description }}</p>
                            </div>
                            <div>
                                <a target="_blank" class="btn btn-sm btn-outline-primary"
                                    :href="'/storage/book/file/' + book.file">download</a>
                                <Link class="ml-4 btn btn-sm btn-outline-secondary"
                                    :href="route('book.books.index', { language: 0, category: 0, sub_category: 0 })">
                                back to
                                list</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="card">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <div class="mx-md-5">
                        <form @submit.prevent="submitLike" class="d-inline"><button type="submit" class="btn like"
                                :class="{ 'btn-secondary': has_liked, 'btn-outline-secondary': !has_liked }"><i
                                    class="fa-regular fa-thumbs-up"></i>
                                {{ likes_count }}</button></form>
                        <form @submit.prevent="submitDislike" class="d-inline"><button class="btn dislike"
                                :class="{ 'btn-secondary': has_disliked, 'btn-outline-secondary': !has_disliked }"><i
                                    class="fa-regular fa-thumbs-down"></i></button></form>
                        <button class="btn mx-4 d-none d-md-inline"
                            :class="{ 'btn-secondary': has_copyright_report, 'btn-outline-secondary': !has_copyright_report }"
                            data-bs-toggle="modal" data-bs-target="#modal-report-copyright">{{
                                copyright_reports_count
                            }}
                            | report copyright</button>
                        <button class="btn mx-4 d-md-none"
                            :class="{ 'btn-secondary': has_copyright_report, 'btn-outline-secondary': !has_copyright_report }"
                            data-bs-toggle="modal" data-bs-target="#modal-report-copyright">{{
                                copyright_reports_count
                            }}
                            | ©</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="card">
            <form @submit.prevent="submitComment">
                <div class="card-body mx-md-5">
                    <div class="text-lg">Add new comment</div>
                    <textarea class="form-control my-3" name="body" id="body" cols="30" rows="3"
                        v-model="commentForm.body" placeholder="Type your comment"></textarea>
                    <button class="btn btn-primary" type="submit">Comment</button>
                </div>
            </form>
        </div>
        <div class="mx-md-5">
            <div class="text-lg">Comments</div>
            <div v-for="comment in book.comments" :key="comment.id">
                <div class="d-flex my-3">
                    <img v-if="comment.user.image" :src="'/storage/user/image/' + comment.user.image"
                        class="rounded-circle my-2 me-3" height="40" alt="img" loading="lazy" />
                    <img v-else src="/storage/user/image/default.jpg" class="rounded-circle my-2 me-3" height="40"
                        alt="img" loading="lazy" />
                    <div class="card table-responsive">
                        <div class="card-body py-2">
                            <div class="text-bold">{{ comment.user.name }}</div>
                            <small class="fst-italic text-muted">{{ new
                                Date(comment.created_at).toLocaleDateString('en-US',
                                    { month: 'short', day: 'numeric', year: 'numeric' }) }}</small>
                            <div class="mt-2">{{ comment.body }}</div>
                            <div v-if="comment.replies.length !== 0">
                                <div class="text-muted my-3">
                                    REPLIES
                                </div>
                                <div v-for="reply in comment.replies" :key="reply.id" class="d-flex mt-3">
                                    <img v-if="reply.user.image" :src="'/storage/user/image/' + reply.user.image"
                                        class="rounded-circle my-2 me-3" height="40" alt="img" loading="lazy" />
                                    <img v-else src="/storage/user/image/default.jpg" class="rounded-circle my-2 me-3"
                                        height="40" alt="img" loading="lazy" />
                                    <div class="card bg-light table-responsive">
                                        <div class="card-body py-2">
                                            <div class="text-bold">{{ reply.user.name }}</div>
                                            <small class="fst-italic text-muted">{{ new
                                Date(reply.created_at).toLocaleDateString('en-US',
                                    { month: 'short', day: 'numeric', year: 'numeric' }) }}</small>
                                            <div class="mt-2">{{ reply.body }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <a href="#" data-bs-toggle="modal" :data-bs-target="'#modal-reply-' + comment.id">Reply</a>
                        </div>
                    </div>
                    <!-- Reply modal -->
                    <div class="modal fade modal-danger" :id="'modal-reply-' + comment.id">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">
                                <form @submit.prevent="submitReply(comment.id)">
                                    <div class="card mb-0">
                                        <div class="card-body">
                                            <div class="container-fluid form-group">
                                                <div class="input-group mb-3">
                                                    <textarea class="form-control" name="reply_body" id="reply_body"
                                                        cols="30" rows="5" v-model="replyForm.body"
                                                        placeholder="Write a reply here" required></textarea>
                                                </div>
                                            </div>
                                            <div class="text-right">
                                                <button type="button" class="btn btn-outline-primary m-1"
                                                    data-bs-dismiss="modal" id="close-reply">Close</button>
                                                <button type="submit" class="btn btn-primary m-1"
                                                    style="min-width:120px">Reply</button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Report copyright modal -->
    <div class="modal fade" id="modal-report-copyright">
        <div class="modal-dialog">
            <div class="modal-content">
                <form @submit.prevent="submitCopyrightReport">
                    <div class="card mb-0">
                        <div class="card-header">
                            <h4 class="font-weight-normal">Report copyright</h4>
                        </div>
                        <div class="card-body">
                            <div class="container-fluid form-group">
                                <label for="name">Add reason</label>
                                <div class="input-group mb-3">
                                    <textarea class="form-control" name="description" id="description" cols="30"
                                        rows="5" v-model="copyrightForm.description"
                                        placeholder="Add reason (optional)"></textarea>
                                </div>
                            </div>
                            <div class="text-right">
                                <button type="button" class="btn btn-outline-primary m-1" data-bs-dismiss="modal"
                                    id="close">Close</button>
                                <form v-if="has_copyright_report" @submit.prevent="submitRemoveCopyright"
                                    class="d-inline">
                                    <button class="btn btn-primary">Remove</button>
                                </form>
                                <button type="submit" class="btn btn-primary m-1"
                                    style="min-width:120px">Report</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
h4,
h6,
h1 {
    font-size: 1.3rem;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

hr {
    background-color: #000000;
}

.like {
    border-top-left-radius: 20%;
    border-bottom-left-radius: 20%;
    border-top-right-radius: 0%;
    border-bottom-right-radius: 0%;
}

.dislike {
    border-top-left-radius: 0%;
    border-bottom-left-radius: 0%;
    border-top-right-radius: 30%;
    border-bottom-right-radius: 30%;
}
</style>