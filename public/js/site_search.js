// Doctor & speciality autocomplete. Used by the hero search (#searchform) and by every
// form marked [data-site-search] (the sticky action bar).
function initSiteSearch(form, search_input, suggestions, trendingBox, initialSearchDiv) {
    if (!search_input || !suggestions) return;

    const hide = () => {
        suggestions.style.display = 'none';
        if (trendingBox) trendingBox.style.display = 'none';
        search_input.setAttribute('aria-expanded', 'false');
    };

    // Show trending box when the search input receives focus
    search_input.addEventListener('focus', () => {
        if (trendingBox) {
            trendingBox.style.display = 'block';
        }
    });

    // CLOSE dropdowns when clicking outside this search area
    document.addEventListener('click', (event) => {
        if (!form.contains(event.target) && !(trendingBox && trendingBox.contains(event.target))) {
            hide();
        }
    });

    search_input.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            hide();
        } else if (event.key === 'ArrowDown') {
            const first = suggestions.querySelector('a');
            if (first) { event.preventDefault(); first.focus(); }
        }
    });

    // Arrow keys move between suggestion links; Escape returns to the field
    suggestions.addEventListener('keydown', (event) => {
        const links = [...suggestions.querySelectorAll('a')];
        const i = links.indexOf(document.activeElement);
        if (event.key === 'ArrowDown' && i < links.length - 1) { event.preventDefault(); links[i + 1].focus(); }
        if (event.key === 'ArrowUp') { event.preventDefault(); (i > 0 ? links[i - 1] : search_input).focus(); }
        if (event.key === 'Escape') { hide(); search_input.focus(); }
    });

    // Search input event
    search_input.addEventListener('input', function () {

        const query = this.value.trim();

        if (query.length > 0) {

            if (initialSearchDiv) {
                initialSearchDiv.style.display = 'none';
            }

            fetch(`/form-sub/search_suggestions.php?keyword=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {

                    suggestions.innerHTML = '';
                    suggestions.style.display = 'block';
                    search_input.setAttribute('aria-expanded', 'true');

                    // Department suggestions
                    if (data.Departments && data.Departments.length > 0) {

                        const altSuggestions = document.createElement('div');
                        altSuggestions.classList.add('alt-suggestions');

                        const header = document.createElement('h4');
                        header.textContent = 'Suggested Searches';
                        altSuggestions.appendChild(header);

                        const ul = document.createElement('ul');

                        data.Departments.forEach(item => {

                            const li = document.createElement('li');
                            const link = document.createElement('a');

                            link.href = item.hrefurl;
                            link.textContent = item.phrase;

                            li.appendChild(link);

                            li.addEventListener('click', function () {
                                search_input.value = item.phrase;
                                suggestions.style.display = 'none';
                            });

                            ul.appendChild(li);
                        });

                        altSuggestions.appendChild(ul);
                        suggestions.appendChild(altSuggestions);
                    }

                    // Doctor suggestions
                    if (data.Doctors && data.Doctors.length > 0) {

                        const doctorsSection = document.createElement('div');

                        const header = document.createElement('h4');
                        header.textContent = 'Doctors';
                        doctorsSection.appendChild(header);

                        const doctorList = document.createElement('div');
                        doctorList.classList.add('tag-details');

                        data.Doctors.forEach(item => {

                            const span = document.createElement('span');

                            const link = document.createElement('a');
                            link.href = item.hrefurl;

                            const img = document.createElement('img');
                            img.src = item.image_url;
                            img.alt = item.display_name;
                            img.className = 'search_doctor_image';

                            const details = document.createElement('div');

                            const strong = document.createElement('strong');
                            strong.textContent = item.display_name;

                            const small = document.createElement('small');
                            small.textContent = item.speciality;

                            details.appendChild(strong);
                            details.appendChild(small);

                            link.appendChild(img);
                            link.appendChild(details);
                            span.appendChild(link);

                            span.addEventListener('click', function () {
                                search_input.value = item.display_name;
                                suggestions.style.display = 'none';
                            });

                            doctorList.appendChild(span);
                        });

                        doctorsSection.appendChild(doctorList);
                        suggestions.appendChild(doctorsSection);
                    }

                })
                .catch(error => {
                    console.error('Search suggestions error:', error);
                });

        } else {

            suggestions.innerHTML = '';
            hide();

            if (initialSearchDiv) {
                initialSearchDiv.style.display = 'block';
            }
        }
    });

    // An empty search goes to the full doctor list
    form.addEventListener('submit', (e) => {
        const val = search_input.value.trim();
        if (!val) {
            e.preventDefault();
            window.location.href = '/find-a-doctor';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Hero search (homepage and find-a-doctor)
    const heroForm = document.getElementById('searchform');
    if (heroForm) {
        initSiteSearch(heroForm, document.getElementById('searchInput'), document.getElementById('suggestions'),
            document.getElementById('trendingBox'), document.getElementById('initial_srch_div'));
    }
    // Action bar search, and any other [data-site-search] form
    document.querySelectorAll('[data-site-search]').forEach(form => {
        initSiteSearch(form, form.querySelector('[data-search-input]'), form.querySelector('[data-search-suggestions]'), null, null);
    });
});


// document.addEventListener('DOMContentLoaded', () => {
//         const search_input = document.getElementById('searchInput');
//         const trendingBox = document.getElementById("trendingBox");
//         search_input.addEventListener("focus", () => {
//                 trendingBox.style.display = "block";
//         });
//         if (search_input) {
//             document.getElementById('searchInput').addEventListener('input', function() {
//                 let query = this.value;

//                 if (query.length > 0) {
//                     document.getElementById('initial_srch_div').style.display = 'none';
//                     fetch(`form-sub/search_suggestions.php?keyword=${query}`)
//                         .then(response => response.json())
//                         .then(data => {

//                             let suggestions = document.getElementById('suggestions');
//                             suggestions.innerHTML = '';
//                             suggestions.style.display = 'block';

//                             if (data.length === 0) { // Check if data is empty
//                                 suggestions.innerHTML = ''; // Print blank if no suggestions
//                             } else {
//                                 // Check for both elements
//                                  if (data.Departments.length > 0) {
//                                     // Create the container div
//                                     const altSuggestions = document.createElement('div');
//                                     altSuggestions.classList.add('alt-suggestions');
//                                     altSuggestions.id = 'altSuggestions';

//                                     // Add the header
//                                     const header = document.createElement('h4');
//                                     header.textContent = 'Suggested Searches';
//                                     altSuggestions.appendChild(header);

//                                     // Create a single <ul> for all department links
//                                     const ul = document.createElement('ul');

//                                     data.Departments.forEach(item => {
//                                         const li = document.createElement('li');
//                                         li.innerHTML = `<a href="${item.hrefurl}">${item.phrase}</a>`;

//                                         // Click handler for each suggestion
//                                         li.onclick = function() {
//                                             document.getElementById('searchInput').value = item.phrase;
//                                             suggestions.innerHTML = '';
//                                             suggestions.style.display = 'none';
//                                         };

//                                         ul.appendChild(li);
//                                     });

//                                     // Add the UL to the container
//                                     altSuggestions.appendChild(ul);

//                                     // Finally, append the entire block to suggestions
//                                     suggestions.appendChild(altSuggestions);
//                                 }

//                                 //suggestions.innerHTML += "<br/>";

//                                 if (data.Doctors.length > 0) {
//                                     // Create doctors section container
//                                     const doctorsSection = document.createElement('div');
//                                     doctorsSection.innerHTML = `<h4>Doctors</h4>`;

//                                     // Create tag details wrapper
//                                     const doctorList = document.createElement('div');
//                                     doctorList.classList.add('tag-details');
//                                     doctorList.id = 'doctor_suggest';

//                                     // Loop through each doctor and add to doctorList
//                                     data.Doctors.forEach(item => {
//                                         const span = document.createElement('span');
//                                         span.innerHTML = `
//                                             <a href="${item.hrefurl}">
//                                                 <img src="${item.image_url}" alt="${item.display_name}" class="search_doctor_image">
//                                                 <div>
//                                                     <strong>${item.display_name}</strong>
//                                                     <small>${item.speciality}</small>
//                                                 </div>
//                                             </a>
//                                         `;
//                                         span.onclick = function() {
//                                             document.getElementById('searchInput').value = item.display_name;
//                                             suggestions.innerHTML = '';
//                                             suggestions.style.display = 'none';
//                                         };
//                                         doctorList.appendChild(span);
//                                     });

//                                     // Append the list to the doctors section
//                                     doctorsSection.appendChild(doctorList);

//                                     // Finally, append the entire doctors section to suggestions
//                                     suggestions.appendChild(doctorsSection);
//                                 }


//                             }
//                         });
//                 } else {
//                     document.getElementById('suggestions').innerHTML = '';
//                     document.getElementById('suggestions').style.display = 'none';
//                     document.getElementById('initial_srch_div').style.display = 'block';
//                 }
//             });
//         }
//     });