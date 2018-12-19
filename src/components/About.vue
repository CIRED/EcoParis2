<template>
    <div class="about-wrapper">
        <a href="#" class="about-close" @click.prevent="$emit('dismiss')">X</a>
        
        <section class="about-box">
            <h2>Réalisation et remerciements.</h2>

            <p>EcoParis a été conçu par trois étudiants de l'EPFL pendant le semestre d'automne 2018 dans le cadre du cours de <a href="https://edu.epfl.ch/coursebook/en/data-visualization-COM-480">Data Visualization</a>.</p>

            <ul>
                <li>Alex Ferragni, Master d'Informatique</li>
                <li>Karthigan Sinnathamby, Master en Data Science</li>
                <li>Romain Liautaud, Master en Systèmes de Communication</li>
            </ul>

            <p>Ce projet a été réalisé en colloboration avec <a href="https://naturalcapitalproject.stanford.edu/">Natural Capital Project</a> de Stanford dont la mission consiste 
            à développer des approches scientifiques pour mettre en avant les bénéfices de la nature aux yeux de la société dans le but d'incorporer le patrimoine naturel dans la prise de décision.</p>

            <p>Les données sur les services de rétention des nutriments, recharge des nappes, et pollinisation ont été créées par Emmanuel Faure pour son <a href="https://www.dropbox.com/s/s4ccqoz7yg38sgw/Faure_memoire.pdf?dl=0">mémoire de thèse de Master</a> et restent préliminaires. Le calcul des données ainsi que les limitations sont décrites dans le mémoire.</p>
            
            <p>Les données sur le service de rafraîchissement ne sont fournies qu'à titre illustratif, en attendant les résultat des travaux du projet <a href="https://idefese.wordpress.com/">IDEFESE</a>.
            Les données sur les <a href="http://data.iau-idf.fr/datasets?q=espaces+verts&sort_by=relevance">espaces verts</a> et sur 
            le <a href="http://data.iau-idf.fr/datasets?q=r%C3%A9seau+hydrographique+principal+simplifi%C3%A9+d%27%C3%8Ele-de-france&sort_by=relevance"> réseau hydrographique </a> proviennent de l'IAU Ile-de-France.</p>
            
            <p>Nos remerciements à Perrine Hamel, chargée de recherche au Natural Capital Project, et à Emmanuel Faure pour les descriptions en français des services.</p>
            
            <p>Le logo du perroquet a été réalisé par <a href="https://www.flaticon.com/authors/freepik">Freepik</a> pour <a href="http://www.flaticon.com/">Flaticon</a>.</p>
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
