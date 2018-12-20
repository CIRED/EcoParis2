<template>
    <div class="about-wrapper">
        <a href="#" class="about-close" @click.prevent="$emit('dismiss')">X</a>
        
        <section class="about-box">
            <h2>{{ $t('credits.title') }}</h2>
            <p v-html="$t('credits.what')"></p>
            <ul>
                <li>{{ $t('credits.alex') }}</li>
                <li>{{ $t('credits.karthi') }}</li>
                <li>{{ $t('credits.romain') }}</li>
            </ul>
            <p v-html="$t('credits.collaborators')"></p>
            <p v-html="$t('credits.credits-1')"></p>
            <p v-html="$t('credits.credits-2')"></p>
            <p v-html="$t('credits.thanks')"></p>
            <p v-html="$t('credits.logo')"></p>
        </section>
    </div>
</template>

<script>
export default {}
</script>

<style lang="scss">
.about-wrapper {
    width: 45%;
    height: 60%;
    position: fixed;
    top: 20%;
    left: 18%;
    z-index: 500;
}

.about-box {
    width: 100%;
    height: 100%;
    box-shadow: 0 0 4px rgba(0, 0, 0, .2);
    background: #fff;
    padding: 40px;
    box-sizing: border-box;
    overflow: auto;

    h2 {
        margin-top: 0;
    }

    li {
        font-size: .9em;
    }

    &:after {
        content: "";
        display: block;
        height: 40px;
        width: 100%;
    }
}

.about-close {
    height: 40px;
    width: 40px;
    box-shadow: -2px 0 2px rgba(#000, .2);
    background: #fff;
    outline: none;
    font-size: 14pt;
    line-height: 40px;
    text-align: center;
    text-decoration: none;
    color: #000;
    position: absolute;
    left: -40px;
    top: 0;
}
</style>
