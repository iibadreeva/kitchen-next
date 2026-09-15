import {
  aboutLead,
  dishGroups,
  evolutionText,
  regions,
  traits,
} from "./about.content";

export default function About() {
  return (
    <article className="about">
      <header className="about__lead">
        <p className="about__eyebrow">Русская кухня</p>
        <h2 className="about__title">{aboutLead.title}</h2>
        {aboutLead.paragraphs.map((paragraph) => (
          <p key={paragraph} className="about__lede">
            {paragraph}
          </p>
        ))}
      </header>

      <section className="about__section" aria-labelledby="about-traits">
        <h2 id="about-traits" className="about__section-title">
          Характерные черты
        </h2>
        <ul className="about__traits">
          {traits.map((trait) => (
            <li key={trait.title} className="about__trait">
              <h3 className="about__trait-title">{trait.title}</h3>
              <p className="about__body">{trait.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="about__section" aria-labelledby="about-dishes">
        <h2 id="about-dishes" className="about__section-title">
          Знаковые блюда
        </h2>
        <div className="about__groups">
          {dishGroups.map((group) => (
            <div key={group.title} className="about__group">
              <h3 className="about__group-title">{group.title}</h3>
              <ul className="about__dishes">
                {group.dishes.map((dish) => (
                  <li key={dish.name} className="about__dish">
                    <span className="about__dish-name">{dish.name}</span>
                    <span className="about__dish-sep" aria-hidden>
                      —
                    </span>
                    <span className="about__body">{dish.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="about__section" aria-labelledby="about-regions">
        <h2 id="about-regions" className="about__section-title">
          Региональные особенности
        </h2>
        <p className="about__body about__regions-intro">
          Русская кухня неоднородна: в разных частях страны свои предпочтения.
        </p>
        <ul className="about__regions">
          {regions.map((region) => (
            <li key={region.name} className="about__region">
              <h3 className="about__region-name">{region.name}</h3>
              <p className="about__body">{region.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="about__section" aria-labelledby="about-evolution">
        <h2 id="about-evolution" className="about__section-title">
          Эволюция кухни
        </h2>
        <p className="about__body">{evolutionText}</p>
      </section>
    </article>
  );
}
