<script setup>
import List from '@/Components/General/List.vue';
defineProps({
    users: Object
})
</script>

<script>
import AdminLayout from '@/Layouts/Main/AdminLayout.vue';
export default {
    layout: AdminLayout
}
</script>

<template>

    <Head title="Users" />

    <List>
        <template v-slot:title>
            <h4 class="font-weight-normal">Users</h4>
        </template>
        <template v-slot:pages-top>
            <div class="pagination justify-content-center table-responsive">
                <ul class="pagination">
                    <li v-for="link in users.links" :key="link.label"
                        :class="['page-item', { 'active': link.active, 'disabled': !link.url }]">
                        <Link v-if="link.url" class="page-link" :href="link.url">
                        <span v-if="link.label.includes('Previous')">&laquo;</span>
                        <span v-else-if="link.label.includes('Next')">&raquo;</span>
                        <span v-else v-html="link.label"></span>
                        </Link>
                        <span v-else class="page-link">
                            <span v-if="link.label.includes('Previous')">&laquo;</span>
                            <span v-else-if="link.label.includes('Next')">&raquo;</span>
                            <span v-else v-html="link.label"></span>
                        </span>
                    </li>
                </ul>
            </div>
        </template>
        <template v-slot:thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role/s</th>
                <th></th>
            </tr>
        </template>
        <template v-if="users.data.length" v-slot:tbody>
            <tr v-for="user, index in users.data" :key="user.id">
                <td>{{ index + 1 }}</td>
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.roles.map((role) => role.name).join(', ') }}</td>
                <td>
                    <Link :href="route('admin.users.show', user.id)">view</Link>
                </td>
            </tr>
        </template>
        <template v-else v-slot:tbody>
            <tr>
                <td colspan="6" class="text-center">
                    ገና ምንም ተጠቃሚ የለም። / No users found.
                </td>
            </tr>
        </template>
        <template v-slot:pages-bottom>
            <div class="pagination justify-content-center table-responsive">
                <ul class="pagination">
                    <li v-for="link in users.links" :key="link.label"
                        :class="['page-item', { 'active': link.active, 'disabled': !link.url }]">
                        <Link v-if="link.url" class="page-link" :href="link.url" :preserve-scroll="true">
                        <span v-if="link.label.includes('Previous')">&laquo;</span>
                        <span v-else-if="link.label.includes('Next')">&raquo;</span>
                        <span v-else v-html="link.label"></span>
                        </Link>
                        <span v-else class="page-link">
                            <span v-if="link.label.includes('Previous')">&laquo;</span>
                            <span v-else-if="link.label.includes('Next')">&raquo;</span>
                            <span v-else v-html="link.label"></span>
                        </span>
                    </li>
                </ul>
            </div>
        </template>
    </List>
</template>